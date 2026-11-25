# Backup and Recovery — ProofHire 2.0

## 1. Database Backups
- **Local SQLite (`proofhire.db`):** Copy `proofhire.db` before running schema updates or demo resets.
- **Production PostgreSQL (Supabase):** Enable automated daily point-in-time recovery (PITR) and pre-migration `pg_dump` snapshots:
  ```bash
  pg_dump "$DATABASE_URL" -Fc -f proofhire_backup_$(date +%Y%m%d).dump
  ```

## 2. Audit Ledger & Checkpoint Recovery
- `audit_logs` and `audit_checkpoints` are append-only hash-chained tables.
- Never run `DELETE` or `UPDATE` on production audit rows.
- After any restore, run `POST /api/governance/audit/{college_id}/verify` to confirm `chain_intact: true`.

## 3. Demo Environment Recovery
If demo state is modified during a live presentation, restore cleanly with:
```powershell
$env:PYTHONPATH="."; python scripts/reset_demo.py
```
