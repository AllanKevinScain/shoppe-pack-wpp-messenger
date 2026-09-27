from __future__ import annotations

import httpx

from .config import get_env
from .shopee import Product


async def enrich_copy(product: Product, deterministic_reason: str) -> str:
    key = get_env("GEMINI_API_KEY")
    if not key:
        return deterministic_reason
    prompt = ("Escreva uma frase curta, responsável e em português brasileiro para divulgar uma oferta de afiliado. "
              "Não invente escassez, avaliação, frete ou preço. "
              f"Produto: {product.title}; preço: R$ {product.price:.2f}; motivo: {deterministic_reason}.")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
        response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
