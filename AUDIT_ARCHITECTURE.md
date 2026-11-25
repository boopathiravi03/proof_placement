# Tamper-Evident Audit Architecture — ProofHire 2.0

## Honest Integrity Model
ProofHire uses a **hash-chained, tamper-evident audit ledger** (`AuditService` in `backend/app/services/audit_service.py`), not an externally immutable blockchain.

## Core Mechanisms
1. **Concurrency-Safe Hash Chaining:**
   - `_AUDIT_LOCK` (`threading.Lock`) serializes `AuditService.log_event()` writes so `prev_hash` never forks under concurrent requests.
   - Each `AuditLogEntry` stores `SHA-256(prev_hash + actor + action + created_at.isoformat())`.
   - `AuditChainHead` tracks the latest `last_event_id` and `last_hash` per `college_id`.
2. **Full-Chain Verification (`verify_chain_detailed`):**
   - Recomputes every block's `prev_hash` link and `SHA-256` payload digest from `GENESIS` onward.
   - Persists an `AuditVerificationRun` record (`chain_intact`, `total_checked`, `broken_event_id`, `details`, `verified_by`).
3. **HMAC-SHA256 Checkpoints (`create_signed_checkpoint`):**
   - Signs `"{college_id}:{event_count}:{head_hash}"` with `settings.SECRET_KEY` and stores `AuditCheckpoint`.
   - Production deployments should mirror checkpoints to external WORM storage.
