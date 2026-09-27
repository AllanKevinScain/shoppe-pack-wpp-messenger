from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass
from typing import Any

import httpx

from .config import get_env

ENDPOINT = "https://open-api.affiliate.shopee.com.br/graphql"
QUERY = """query Offers($page: Int!, $limit: Int!) {
  productOfferV2(page: $page, limit: $limit, listType: 0) {
    nodes { productName price priceMin priceMax priceDiscountRate commission commissionRate sales offerLink productLink imageUrl }
  }
}"""


@dataclass(frozen=True)
class Product:
    title: str
    price: float
    discount: float
    commission: float
    commission_rate: float
    sales: int
    offer_link: str

    @classmethod
    def from_api(cls, item: dict[str, Any]) -> "Product":
        def numeric(key: str) -> float:
            value = item.get(key) or 0
            return float(str(value).replace("R$", "").replace(",", ".").strip() or 0)
        return cls(
            title=str(item.get("productName") or item.get("name") or "Produto Shopee"),
            price=numeric("price") or numeric("priceMin"),
            discount=numeric("priceDiscountRate"),
            commission=numeric("commission"),
            commission_rate=numeric("commissionRate"),
            sales=int(numeric("sales")),
            offer_link=str(item.get("offerLink") or item.get("productLink") or ""),
        )


async def fetch_offers(limit: int = 50) -> list[Product]:
    app_id, secret = get_env("SHOPEE_APP_ID"), get_env("SHOPEE_SECRET")
    if not app_id or not secret:
        raise RuntimeError("Configure SHOPEE_APP_ID e SHOPEE_SECRET no arquivo .env.")
    payload = json.dumps({"query": QUERY, "variables": {"page": 1, "limit": limit}}, separators=(",", ":"))
    timestamp = str(int(time.time()))
    signature = hashlib.sha256(f"{app_id}{timestamp}{payload}{secret}".encode()).hexdigest()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"SHA256 Credential={app_id}, Timestamp={timestamp}, Signature={signature}",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(ENDPOINT, content=payload, headers=headers)
        response.raise_for_status()
    body = response.json()
    if body.get("errors"):
        raise RuntimeError(f"Shopee retornou erro: {body['errors']}")
    nodes = body.get("data", {}).get("productOfferV2", {}).get("nodes", [])
    return [Product.from_api(item) for item in nodes if item.get("offerLink") or item.get("productLink")]
