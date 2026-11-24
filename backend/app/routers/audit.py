from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import AuditLogEntry
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Cryptographic Audit Trail"])

@router.get("/{college_id}")
def get_audit_trail(college_id: str, db: Session = Depends(get_db)):
    is_intact, entries = AuditService.verify_chain(db, college_id)
    return {
        "college_id": college_id,
        "chain_intact": is_intact,
        "total_records": len(entries),
        "entries": [
            {
                "id": e.id,
                "actor": e.actor,
                "action": e.action,
                "prev_hash": e.prev_hash,
                "hash": e.hash,
                "created_at": e.created_at.isoformat() if e.created_at else None
            }
            for e in entries
        ]
    }

@router.post("/{college_id}/tamper")
def simulate_tampering(college_id: str, db: Session = Depends(get_db)):
    """
    Simulates malicious tampering on the database row to demonstrate cryptographic integrity detection.
    """
    first_entry = (
        db.query(AuditLogEntry)
        .filter(AuditLogEntry.college_id == college_id)
        .order_by(AuditLogEntry.id.asc())
        .first()
    )
    if not first_entry:
        raise HTTPException(status_code=404, detail="No audit log entries found to tamper with.")

    first_entry.action += " [TAMPERED_BY_ATTACKER]"
    db.commit()

    is_intact, _ = AuditService.verify_chain(db, college_id)
    return {
        "tampered_entry_id": first_entry.id,
        "chain_intact": is_intact,
        "message": "Entry content modified. Cryptographic chain integrity check now detects failure."
    }

@router.post("/{college_id}/log")
def log_event(college_id: str, actor: str, action: str, db: Session = Depends(get_db)):
    entry = AuditService.log_event(db, college_id, actor, action)
    return {
        "success": True,
        "id": entry.id,
        "prev_hash": entry.prev_hash,
        "hash": entry.hash
    }
