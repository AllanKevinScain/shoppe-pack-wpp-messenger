from __future__ import annotations

import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "monitoring.sqlite3"
logger = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def _connect() -> Iterator[sqlite3.Connection]:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=5)
    connection.row_factory = sqlite3.Row
    try:
        with connection:
            connection.execute(
                """CREATE TABLE IF NOT EXISTS dispatch_attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source TEXT NOT NULL,
                    status TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    finished_at TEXT,
                    stage TEXT,
                    product TEXT,
                    error TEXT
                )"""
            )
            connection.execute(
                """CREATE TABLE IF NOT EXISTS automation_state (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    checked_at TEXT NOT NULL,
                    status TEXT NOT NULL
                )"""
            )
            yield connection
    finally:
        connection.close()


def start_attempt(source: str) -> int | None:
    try:
        with _connect() as connection:
            cursor = connection.execute(
                "INSERT INTO dispatch_attempts (source, status, started_at) VALUES (?, 'pending', ?)",
                (source, _now()),
            )
            return cursor.lastrowid
    except (sqlite3.Error, OSError):
        logger.exception("Não foi possível registrar o início do envio.")
        return None


def finish_attempt(attempt_id: int | None, status: str, stage: str, product: str | None = None, error: str | None = None) -> None:
    if attempt_id is None:
        return
    try:
        with _connect() as connection:
            connection.execute(
                "UPDATE dispatch_attempts SET status = ?, finished_at = ?, stage = ?, product = ?, error = ? WHERE id = ?",
                (status, _now(), stage, product, error, attempt_id),
            )
    except (sqlite3.Error, OSError):
        logger.exception("Não foi possível atualizar o registro do envio.")


def record_check(status: str) -> None:
    try:
        with _connect() as connection:
            connection.execute(
                "INSERT INTO automation_state (id, checked_at, status) VALUES (1, ?, ?) "
                "ON CONFLICT(id) DO UPDATE SET checked_at = excluded.checked_at, status = excluded.status",
                (_now(), status),
            )
    except (sqlite3.Error, OSError):
        logger.exception("Não foi possível registrar a verificação do n8n.")


def read_monitor(limit: int = 30) -> dict:
    with _connect() as connection:
        state = connection.execute("SELECT checked_at, status FROM automation_state WHERE id = 1").fetchone()
        attempts = connection.execute(
            "SELECT id, source, status, started_at, finished_at, stage, product, error "
            "FROM dispatch_attempts ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return {
        "last_check": dict(state) if state else None,
        "attempts": [dict(attempt) for attempt in attempts],
    }
