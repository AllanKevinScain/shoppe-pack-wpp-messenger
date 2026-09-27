from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Literal

import jwt
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from .config import get_env, read_settings, write_settings
from .evolution import connection_qr, find_group_jid, send_text
from .gemini import enrich_copy
from .ranking import pick, rationale
from .shopee import fetch_offers

scheduler = AsyncIOScheduler(timezone="America/Sao_Paulo")
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

async def dispatch() -> dict[str, str]:
    settings = read_settings()
    products = await fetch_offers()
    product = pick(products, settings["strategy"])
    reason = rationale(product, settings["strategy"])
    copy = await enrich_copy(product, reason)
    message = f"🔥 Oferta selecionada\n\n*{product.title}*\n💰 R$ {product.price:.2f}\n\n{copy}\n\n🔗 {product.offer_link}\n\nCritério: {reason}."
    jid = await find_group_jid(settings["group_name"])
    await send_text(jid, message)
    write_settings({"last_dispatch_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "Oferta enviada com sucesso.", "product": product.title}

def reschedule() -> None:
    settings = read_settings()
    scheduler.add_job(dispatch, "interval", minutes=settings["interval_minutes"], id="offer-dispatch", replace_existing=True)

@asynccontextmanager
async def lifespan(_: FastAPI):
    reschedule()
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)

app = FastAPI(title="Shopee Pack WPP Messenger", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("ADMIN_ORIGIN", "http://localhost:5173")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

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
    result = write_settings(body.model_dump())
    reschedule()
    return result

@app.get("/whatsapp/qr")
async def qr(_: str = Depends(admin)): return await connection_qr()

@app.post("/jobs/dispatch")
async def send_now(_: str = Depends(admin)):
    try: return await dispatch()
    except RuntimeError as error: raise HTTPException(status_code=400, detail=str(error)) from error
