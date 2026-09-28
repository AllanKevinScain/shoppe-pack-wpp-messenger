from __future__ import annotations

import json
import os
from pathlib import Path
from threading import RLock
from typing import Any

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")
DATA_FILE = ROOT / "backend" / "data" / "settings.json"
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
_lock = RLock()

DEFAULT_SETTINGS: dict[str, Any] = {
    "group_name": "pack_shopee_ia",
    "interval_minutes": 180,
    "strategy": "best_potential",
    "authorized_numbers": [],
    "last_dispatch_at": None,
    "schedule_started_at": None,
}


def get_env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


def read_settings() -> dict[str, Any]:
    with _lock:
        if not DATA_FILE.exists():
            return DEFAULT_SETTINGS.copy()
        return {**DEFAULT_SETTINGS, **json.loads(DATA_FILE.read_text(encoding="utf-8"))}


def write_settings(values: dict[str, Any]) -> dict[str, Any]:
    with _lock:
        settings = {**read_settings(), **values}
        DATA_FILE.write_text(json.dumps(settings, ensure_ascii=False, indent=2), encoding="utf-8")
        return settings
