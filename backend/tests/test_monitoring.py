import asyncio
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx

from app import main, monitoring


class MonitoringTests(unittest.TestCase):
    def test_attempts_and_checks_are_persisted(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(monitoring, "DB_PATH", Path(directory) / "monitoring.sqlite3"):
                attempt_id = monitoring.start_attempt("automatic")
                monitoring.finish_attempt(attempt_id, "accepted", "Envio à Evolution API", product="Produto")
                monitoring.record_check("accepted")
                result = monitoring.read_monitor()
        self.assertEqual(result["last_check"]["status"], "accepted")
        self.assertEqual(result["attempts"][0]["source"], "automatic")
        self.assertEqual(result["attempts"][0]["status"], "accepted")

    def test_failed_send_records_safe_error(self):
        private_error = httpx.ConnectError("token-secreto")
        with patch.object(main, "fetch_offers", new_callable=AsyncMock, side_effect=private_error), patch.object(main, "start_attempt", return_value=7), patch.object(main, "finish_attempt") as finish:
            with self.assertRaises(httpx.ConnectError):
                asyncio.run(main._send_offer({"strategy": "best_potential", "group_name": "grupo"}, "automatic"))
        self.assertEqual(finish.call_args.args[:3], (7, "failed", "Consulta à Shopee"))
        self.assertNotIn("token-secreto", finish.call_args.kwargs["error"])


if __name__ == "__main__":
    unittest.main()
