import asyncio
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

from app import main


class AutomaticDispatchTests(unittest.TestCase):
    def test_first_check_starts_interval_without_sending(self):
        settings = {"schedule_started_at": None, "interval_minutes": 30}
        with patch.object(main, "read_settings", return_value=settings), patch.object(main, "write_settings") as write, patch.object(main, "record_check") as check, patch.object(main, "_send_offer", new_callable=AsyncMock) as send:
            result = asyncio.run(main.send_due(None))
        self.assertEqual(result["status"], "scheduled")
        write.assert_called_once()
        check.assert_called_once_with("scheduled")
        send.assert_not_called()

    def test_check_before_interval_does_not_send(self):
        settings = {
            "schedule_started_at": (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat(),
            "interval_minutes": 30,
        }
        with patch.object(main, "read_settings", return_value=settings), patch.object(main, "record_check") as check, patch.object(main, "_send_offer", new_callable=AsyncMock) as send:
            result = asyncio.run(main.send_due(None))
        self.assertEqual(result["status"], "waiting")
        check.assert_called_once_with("waiting")
        send.assert_not_called()

    def test_check_after_interval_sends_once(self):
        settings = {
            "schedule_started_at": (datetime.now(timezone.utc) - timedelta(minutes=31)).isoformat(),
            "interval_minutes": 30,
        }
        with patch.object(main, "read_settings", return_value=settings), patch.object(main, "record_check") as check, patch.object(main, "_send_offer", new_callable=AsyncMock, return_value={"message": "ok", "product": "item"}) as send:
            result = asyncio.run(main.send_due(None))
        self.assertEqual(result["status"], "sent")
        check.assert_called_once_with("accepted")
        send.assert_awaited_once_with(settings, "automatic")

    def test_failed_automatic_send_marks_last_check(self):
        settings = {
            "schedule_started_at": (datetime.now(timezone.utc) - timedelta(minutes=31)).isoformat(),
            "interval_minutes": 30,
        }
        with patch.object(main, "read_settings", return_value=settings), patch.object(main, "record_check") as check, patch.object(main, "_send_offer", new_callable=AsyncMock, side_effect=RuntimeError("Falhou")):
            with self.assertRaises(RuntimeError):
                asyncio.run(main.send_due(None))
        check.assert_called_once_with("failed")

    def test_invalid_automation_token_is_rejected(self):
        with patch.object(main, "get_env", return_value="correct-token"):
            with self.assertRaises(HTTPException) as raised:
                main.automation("wrong-token")
        self.assertEqual(raised.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
