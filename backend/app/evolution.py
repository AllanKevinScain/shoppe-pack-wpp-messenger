from __future__ import annotations

from typing import Any
import httpx

from .config import get_env


def _headers() -> dict[str, str]:
    return {"apikey": get_env("EVOLUTION_API_KEY")}


def _base() -> str:
    return get_env("EVOLUTION_BASE_URL", "http://localhost:8080").rstrip("/")


async def connection_qr() -> dict[str, Any]:
    instance = get_env("EVOLUTION_INSTANCE", "shopee-messenger")
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(f"{_base()}/instance/connect/{instance}", headers=_headers())
        if response.status_code == 404:
            created = await client.post(
                f"{_base()}/instance/create",
                headers=_headers(),
                json={"instanceName": instance, "integration": "WHATSAPP-BAILEYS", "qrcode": True},
            )
            created.raise_for_status()
            return created.json()
        response.raise_for_status()
    return response.json()


async def find_group_jid(group_name: str) -> str:
    instance = get_env("EVOLUTION_INSTANCE", "shopee-messenger")
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            f"{_base()}/group/fetchAllGroups/{instance}",
            headers=_headers(),
            params={"getParticipants": "false"},
        )
        response.raise_for_status()
    groups = response.json()
    matches = [group for group in groups if group.get("subject", "").casefold() == group_name.casefold()]
    if not matches:
        raise RuntimeError(f"Grupo '{group_name}' não encontrado na conta conectada.")
    return str(matches[0].get("id"))


async def send_text(group_jid: str, text: str) -> dict[str, Any]:
    instance = get_env("EVOLUTION_INSTANCE", "shopee-messenger")
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(f"{_base()}/message/sendText/{instance}", headers=_headers(), json={"number": group_jid, "text": text})
        response.raise_for_status()
    return response.json()
