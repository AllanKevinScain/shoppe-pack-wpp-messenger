from __future__ import annotations

import logging

import httpx

from .config import get_env
from .shopee import Product

logger = logging.getLogger(__name__)


async def enrich_copy(product: Product, deterministic_reason: str) -> str:
    key = get_env("GEMINI_API_KEY")
    if not key:
        return deterministic_reason
    prompt = ("Escreva uma frase curta, responsável e em português brasileiro para divulgar uma oferta de afiliado. "
              "Não invente escassez, avaliação, frete ou preço. "
              f"Produto: {product.title}; preço: R$ {product.price:.2f}; motivo: {deterministic_reason}.")
    model = get_env("GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(url, headers={"x-goog-api-key": key}, json={"contents": [{"parts": [{"text": prompt}]}]})
            response.raise_for_status()
        copy = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        if not copy:
            raise ValueError("Resposta vazia do Gemini")
        return copy
    except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError) as error:
        logger.warning("Gemini indisponível (%s); usando texto determinístico.", type(error).__name__)
        return deterministic_reason
