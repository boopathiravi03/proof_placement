import hashlib
from datetime import datetime
from typing import Tuple, List
from sqlalchemy.orm import Session
from backend.app.models.models import AuditLogEntry

class AuditService:
    @staticmethod
    def calculate_hash(prev_hash: str, actor: str, action: str, timestamp_str: str) -> str:
        payload = f"{prev_hash}{actor}{action}{timestamp_str}".encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    @staticmethod
    def log_event(db: Session, college_id: str, actor: str, action: str) -> AuditLogEntry:
        last_entry = (
            db.query(AuditLogEntry)
            .filter(AuditLogEntry.college_id == college_id)
            .order_by(AuditLogEntry.id.desc())
            .first()
        )
        prev_hash = last_entry.hash if last_entry else "GENESIS"
        now = datetime.utcnow()
        # Canonical string formatting of timestamp
        ts_str = now.isoformat()
        current_hash = AuditService.calculate_hash(prev_hash, actor, action, ts_str)
        
        entry = AuditLogEntry(
            college_id=college_id,
            actor=actor,
            action=action,
            prev_hash=prev_hash,
            hash=current_hash,
            created_at=now
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def verify_chain(db: Session, college_id: str) -> Tuple[bool, List[AuditLogEntry]]:
        entries = (
            db.query(AuditLogEntry)
            .filter(AuditLogEntry.college_id == college_id)
            .order_by(AuditLogEntry.id.asc())
            .all()
        )
        if not entries:
            return True, []
        
        is_intact = True
        for i, entry in enumerate(entries):
            expected_prev = "GENESIS" if i == 0 else entries[i - 1].hash
            if entry.prev_hash != expected_prev:
                is_intact = False
                break
            
            recomputed = AuditService.calculate_hash(
                entry.prev_hash, entry.actor, entry.action, entry.created_at.isoformat()
            )
            if entry.hash != recomputed:
                is_intact = False
                break
                
        return is_intact, entries
