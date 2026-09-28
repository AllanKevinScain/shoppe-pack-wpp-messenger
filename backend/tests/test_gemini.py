import asyncio
import unittest
from unittest.mock import patch

import httpx

from app.gemini import enrich_copy
from app.shopee import Product


PRODUCT = Product("Produto de teste", 20.0, 0.0, 2.0, 10.0, 1, "https://example.com")
REASON = "Boa comissão."


class GeminiFallbackTests(unittest.TestCase):
    def run_enrichment(self, key: str, handler=None) -> str:
        def fake_env(name: str, default: str = "") -> str:
            return key if name == "GEMINI_API_KEY" else default

        with patch("app.gemini.get_env", side_effect=fake_env):
            if handler is None:
                return asyncio.run(enrich_copy(PRODUCT, REASON))
            real_client = httpx.AsyncClient
            with patch("app.gemini.httpx.AsyncClient", side_effect=lambda **kwargs: real_client(transport=httpx.MockTransport(handler), **kwargs)):
                return asyncio.run(enrich_copy(PRODUCT, REASON))

    def test_without_key_uses_deterministic_text(self):
        self.assertEqual(self.run_enrichment(""), REASON)

    def test_success_uses_gemini_text(self):
        def handler(request):
            self.assertEqual(request.headers["x-goog-api-key"], "test-key")
            return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": "Texto Gemini"}]}}]})

        self.assertEqual(self.run_enrichment("test-key", handler), "Texto Gemini")

    def test_http_error_uses_deterministic_text(self):
        self.assertEqual(self.run_enrichment("test-key", lambda _: httpx.Response(404)), REASON)

    def test_connection_error_uses_deterministic_text(self):
        def handler(_):
            raise httpx.ConnectError("Falha de conexão")

        self.assertEqual(self.run_enrichment("test-key", handler), REASON)

    def test_invalid_response_uses_deterministic_text(self):
        self.assertEqual(self.run_enrichment("test-key", lambda _: httpx.Response(200, json={"candidates": []})), REASON)

    def test_empty_response_uses_deterministic_text(self):
        response = {"candidates": [{"content": {"parts": [{"text": "  "}]}}]}
        self.assertEqual(self.run_enrichment("test-key", lambda _: httpx.Response(200, json=response)), REASON)


if __name__ == "__main__":
    unittest.main()
