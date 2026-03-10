import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone

from server.models import CreatureSchema

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "pokedex.db")


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the creatures table if it doesn't exist."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = _get_conn()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS creatures (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                types TEXT NOT NULL,
                base_stats TEXT NOT NULL,
                moves TEXT NOT NULL,
                sprite_svg TEXT,
                current_hp INTEGER NOT NULL,
                max_hp INTEGER NOT NULL,
                status TEXT,
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()
    finally:
        conn.close()


def save_creature(creature: CreatureSchema) -> str:
    """Save a creature to the database and return its id."""
    creature_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    conn = _get_conn()
    try:
        conn.execute(
            """
            INSERT INTO creatures (id, name, description, types, base_stats, moves,
                                   sprite_svg, current_hp, max_hp, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                creature_id,
                creature.name,
                creature.description,
                json.dumps(creature.types),
                json.dumps(creature.base_stats.model_dump()),
                json.dumps([m.model_dump() for m in creature.moves]),
                creature.sprite_svg,
                creature.current_hp,
                creature.max_hp,
                creature.status,
                created_at,
            ),
        )
        conn.commit()
        return creature_id
    finally:
        conn.close()


def _row_to_dict(row: sqlite3.Row) -> dict:
    """Convert a database row into a full creature dict with parsed JSON fields."""
    d = dict(row)
    d["types"] = json.loads(d["types"])
    d["base_stats"] = json.loads(d["base_stats"])
    d["moves"] = json.loads(d["moves"])
    return d


def list_creatures() -> list[dict]:
    """Return all creatures sorted by created_at descending."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM creatures ORDER BY created_at DESC"
        ).fetchall()
        return [_row_to_dict(r) for r in rows]
    finally:
        conn.close()


def get_creature(creature_id: str) -> dict | None:
    """Return a single creature by id, or None if not found."""
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM creatures WHERE id = ?", (creature_id,)
        ).fetchone()
        if row is None:
            return None
        return _row_to_dict(row)
    finally:
        conn.close()


def delete_creature(creature_id: str) -> bool:
    """Delete a creature by id. Returns True if a row was deleted."""
    conn = _get_conn()
    try:
        cursor = conn.execute(
            "DELETE FROM creatures WHERE id = ?", (creature_id,)
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
