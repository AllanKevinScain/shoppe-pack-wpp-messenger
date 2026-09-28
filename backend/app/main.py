from __future__ import annotations

import asyncio
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Literal

import jwt
import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from .config import get_env, read_settings, write_settings
from .evolution import connection_qr, find_group_jid, send_text
from .gemini import enrich_copy
from .monitoring import finish_attempt, read_monitor, record_check, start_attempt
from .ranking import pick, rationale
from .shopee import fetch_offers

dispatch_lock = asyncio.Lock()
security = HTTPBearer()

class Login(BaseModel):
    email: str
    password: str

class SettingsInput(BaseModel):
    group_name: str = Field(min_length=3, max_length=100)
    interval_minutes: int = Field(ge=15, le=10080)
    strategy: Literal["lowest_price", "highest_commission", "best_potential"]
    authorized_numbers: list[str] = Field(default_factory=list)

def token_for(email: str) -> str:
    return jwt.encode({"sub": email, "exp": datetime.now(timezone.utc) + timedelta(hours=8)}, get_env("ADMIN_SESSION_SECRET"), algorithm="HS256")

def admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        return str(jwt.decode(credentials.credentials, get_env("ADMIN_SESSION_SECRET"), algorithms=["HS256"])["sub"])
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida.") from error

def automation(x_dispatch_token: str | None = Header(default=None)) -> None:
    expected = get_env("N8N_DISPATCH_TOKEN")
    if not expected or not x_dispatch_token or not hmac.compare_digest(x_dispatch_token, expected):
        raise HTTPException(status_code=401, detail="Token de automação inválido.")

def _safe_error(error: Exception, stage: str) -> str:
    if isinstance(error, httpx.TimeoutException):
        return f"{stage}: tempo de resposta esgotado."
    if isinstance(error, httpx.HTTPStatusError):
        return f"{stage}: serviço respondeu HTTP {error.response.status_code}."
    if isinstance(error, httpx.RequestError):
        return f"{stage}: falha de conexão com o serviço."
    if stage == "Localização do grupo" and isinstance(error, RuntimeError):
        return str(error)[:200]
    return f"{stage}: {type(error).__name__}."

async def _send_offer(settings: dict, source: str) -> dict[str, str]:
    attempt_id = start_attempt(source)
    stage = "Consulta à Shopee"
    try:
        products = await fetch_offers()
        stage = "Seleção do produto"
        product = pick(products, settings["strategy"])
        reason = rationale(product, settings["strategy"])
        stage = "Redação da oferta"
        copy = await enrich_copy(product, reason)
        message = f"🔥 Oferta selecionada\n\n*{product.title}*\n💰 R$ {product.price:.2f}\n\n{copy}\n\n🔗 {product.offer_link}\n\nCritério: {reason}."
        stage = "Localização do grupo"
        jid = await find_group_jid(settings["group_name"])
        stage = "Envio à Evolution API"
        await send_text(jid, message)
        stage = "Atualização da agenda"
        sent_at = datetime.now(timezone.utc).isoformat()
        write_settings({"last_dispatch_at": sent_at, "schedule_started_at": sent_at})
    except Exception as error:
        finish_attempt(attempt_id, "failed", stage, error=_safe_error(error, stage))
        raise
    finish_attempt(attempt_id, "accepted", "Envio à Evolution API", product=product.title)
    return {"message": "Oferta aceita pela Evolution API.", "product": product.title}

async def dispatch() -> dict[str, str]:
    async with dispatch_lock:
        return await _send_offer(read_settings(), "manual")

app = FastAPI(title="Shopee Pack WPP Messenger")
admin_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
admin_origins.extend(origin.strip() for origin in os.getenv("ADMIN_ORIGIN", "").split(",") if origin.strip())
app.add_middleware(CORSMiddleware, allow_origins=admin_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health(): return {"status": "ok"}

@app.post("/auth/login")
async def login(body: Login):
    if body.email != get_env("ADMIN_EMAIL") or body.password != get_env("ADMIN_PASSWORD"):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
    return {"token": token_for(body.email)}

@app.get("/settings")
async def get_settings(_: str = Depends(admin)): return read_settings()

@app.put("/settings")
async def update_settings(body: SettingsInput, _: str = Depends(admin)):
    async with dispatch_lock:
        return write_settings({**body.model_dump(), "schedule_started_at": datetime.now(timezone.utc).isoformat()})

@app.get("/whatsapp/qr")
async def qr(_: str = Depends(admin)): return await connection_qr()

@app.post("/jobs/dispatch")
async def send_now(_: str = Depends(admin)):
    try: return await dispatch()
    except RuntimeError as error: raise HTTPException(status_code=400, detail=str(error)) from error

@app.post("/jobs/dispatch-due")
async def send_due(_: None = Depends(automation)):
    async with dispatch_lock:
        settings = read_settings()
        now = datetime.now(timezone.utc)
        anchor_text = settings.get("schedule_started_at")
        if not anchor_text:
            write_settings({"schedule_started_at": now.isoformat()})
            record_check("scheduled")
            return {"status": "scheduled", "message": "Primeiro envio agendado a partir de agora."}
        anchor = datetime.fromisoformat(anchor_text)
        if now < anchor + timedelta(minutes=settings["interval_minutes"]):
            record_check("waiting")
            return {"status": "waiting", "message": "Intervalo ainda não concluído."}
        try:
            result = await _send_offer(settings, "automatic")
        except Exception:
            record_check("failed")
            raise
        record_check("accepted")
        return {"status": "sent", **result}

@app.get("/jobs/monitor")
async def monitor(_: str = Depends(admin)):
    settings = read_settings()
    anchor_text = settings.get("schedule_started_at")
    next_due_at = (
        (datetime.fromisoformat(anchor_text) + timedelta(minutes=settings["interval_minutes"])).isoformat()
        if anchor_text else None
    )
    return {
        **read_monitor(),
        "server_time": datetime.now(timezone.utc).isoformat(),
        "next_due_at": next_due_at,
        "last_dispatch_at": settings.get("last_dispatch_at"),
        "interval_minutes": settings["interval_minutes"],
    }
