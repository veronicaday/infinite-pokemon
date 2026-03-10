import uuid
from dataclasses import dataclass, field
from datetime import datetime

from core.battle import BattleEngine


@dataclass
class BattleSession:
    engine: BattleEngine
    created_at: datetime = field(default_factory=datetime.now)


sessions: dict[str, BattleSession] = {}


def create_session(engine: BattleEngine) -> str:
    session_id = str(uuid.uuid4())
    sessions[session_id] = BattleSession(engine=engine)
    return session_id


def get_session(session_id: str) -> BattleSession | None:
    return sessions.get(session_id)


def remove_session(session_id: str) -> None:
    sessions.pop(session_id, None)
