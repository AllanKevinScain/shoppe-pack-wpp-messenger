from __future__ import annotations

from .shopee import Product


def score(product: Product) -> float:
    """Score transparente: desconto e comissão aumentam potencial; preço extremo reduz alcance."""
    accessible_price = max(0, 1 - max(product.price - 250, 0) / 1000)
    return product.sales * 0.45 + product.discount * 3 + product.commission_rate * 4 + product.commission * 2 + accessible_price * 25


def pick(products: list[Product], strategy: str) -> Product:
    if not products:
        raise RuntimeError("A Shopee não retornou ofertas com link de afiliado.")
    if strategy == "lowest_price":
        return min(products, key=lambda product: product.price or float("inf"))
    if strategy == "highest_commission":
        return max(products, key=lambda product: (product.commission_rate, product.commission))
    return max(products, key=score)


def rationale(product: Product, strategy: str) -> str:
    if strategy == "lowest_price":
        return "selecionado pelo menor preço entre as ofertas elegíveis"
    if strategy == "highest_commission":
        return "selecionado pela melhor comissão para o afiliado"
    return "selecionado pelo maior potencial: vendas, desconto, comissão e faixa de preço"
