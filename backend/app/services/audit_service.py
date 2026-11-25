import hashlib
import hmac
import json
import threading
from datetime import datetime
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.models.models import (
    AuditLogEntry,
    AuditChainHead,
    AuditCheckpoint,
    AuditVerificationRun,
)

# Process-wide lock ensuring concurrent audit writes serialize safely per chain
_AUDIT_LOCK = threading.Lock()


class AuditService:
    @staticmethod
    def calculate_hash(prev_hash: str, actor: str, action: str, timestamp_str: str) -> str:
        payload = f"{prev_hash}{actor}{action}{timestamp_str}".encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    @staticmethod
    def log_event(db: Session, college_id: str, actor: str, action: str) -> AuditLogEntry:
        with _AUDIT_LOCK:
            last_entry = (
                db.query(AuditLogEntry)
                .filter(AuditLogEntry.college_id == college_id)
                .order_by(AuditLogEntry.id.desc())
                .first()
            )
            prev_hash = last_entry.hash if last_entry else "GENESIS"
            now = datetime.utcnow()
            ts_str = now.isoformat()
            current_hash = AuditService.calculate_hash(prev_hash, actor, action, ts_str)

            entry = AuditLogEntry(
                college_id=college_id,
                actor=actor,
                action=action,
                prev_hash=prev_hash,
                hash=current_hash,
                created_at=now,
            )
            db.add(entry)
            db.flush()

            # Update atomic chain head
            head = db.query(AuditChainHead).filter(AuditChainHead.college_id == college_id).first()
            if not head:
                head = AuditChainHead(college_id=college_id, last_event_id=entry.id, last_hash=current_hash)
                db.add(head)
            else:
                head.last_event_id = entry.id
                head.last_hash = current_hash

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

    @staticmethod
    def verify_chain_detailed(db: Session, college_id: str, verified_by: str = "System Auditor") -> Dict[str, Any]:
        entries = (
            db.query(AuditLogEntry)
            .filter(AuditLogEntry.college_id == college_id)
            .order_by(AuditLogEntry.id.asc())
            .all()
        )
        is_intact = True
        broken_event_id = None
        details = "All hashes and previous-hash links match canonical event payloads."

        for i, entry in enumerate(entries):
            expected_prev = "GENESIS" if i == 0 else entries[i - 1].hash
            if entry.prev_hash != expected_prev:
                is_intact = False
                broken_event_id = entry.id
                details = f"Broken prev_hash link at event ID {entry.id}."
                break

            recomputed = AuditService.calculate_hash(
                entry.prev_hash, entry.actor, entry.action, entry.created_at.isoformat()
            )
            if entry.hash != recomputed:
                is_intact = False
                broken_event_id = entry.id
                details = f"Payload modification detected at event ID {entry.id} (hash mismatch)."
                break

        run = AuditVerificationRun(
            college_id=college_id,
            chain_intact=is_intact,
            total_checked=len(entries),
            broken_event_id=broken_event_id,
            details=details,
            verified_by=verified_by,
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        return {
            "verification_run_id": run.id,
            "college_id": college_id,
            "chain_intact": is_intact,
            "total_checked": len(entries),
            "broken_event_id": broken_event_id,
            "details": details,
            "integrity_model": "Hash-chain tamper-evident (HMAC-signed checkpoints; external immutable WORM anchor recommended for production)",
            "verified_at": run.verified_at.isoformat() if run.verified_at else None,
        }

    @staticmethod
    def create_signed_checkpoint(db: Session, college_id: str) -> Dict[str, Any]:
        verif = AuditService.verify_chain_detailed(db, college_id, verified_by="Checkpoint Anchor")
        entries = (
            db.query(AuditLogEntry)
            .filter(AuditLogEntry.college_id == college_id)
            .order_by(AuditLogEntry.id.desc())
            .all()
        )
        head_hash = entries[0].hash if entries else "GENESIS"
        msg = f"{college_id}:{len(entries)}:{head_hash}".encode("utf-8")
        sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()

        cp = AuditCheckpoint(
            college_id=college_id,
            event_count=len(entries),
            head_hash=head_hash,
            hmac_signature=sig,
            verified_intact=verif["chain_intact"],
        )
        db.add(cp)
        db.commit()
        db.refresh(cp)

        return {
            "checkpoint_id": cp.id,
            "college_id": college_id,
            "event_count": cp.event_count,
            "head_hash": cp.head_hash,
            "hmac_signature": cp.hmac_signature,
            "verified_intact": cp.verified_intact,
            "created_at": cp.created_at.isoformat() if cp.created_at else None,
        }
