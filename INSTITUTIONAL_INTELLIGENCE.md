# ProofHire 2.0 – Institutional Placement Intelligence Engine

## Overview
`InstitutionalIntelligenceService` transforms ProofHire's operational database records (`students`, `competencies`, `evidence`, `assessment_attempts`, `learning_paths`, `training_interventions`, `placement_drives`, `applications`, `selection_decisions`) into tenant-scoped institutional telemetry.

## Core Modules
1. **Institutional Overview (`/api/intelligence/overview`)**: Real-time counts and rates with branch, target role, company, drive, and reporting-period filters, plus k-anonymity small-group suppression (`0 < n < 3`).
2. **Data Quality Engine (`/api/intelligence/data-quality`)**: Audits missing academic records, duplicate roll numbers, pending baseline assessments, expired competency evidence, and incomplete drive outcomes.
3. **Industry Skill-Demand Profiler (`/api/intelligence/industry-demand`)**: Compares authorized internal job requirements against cohort verified/assessed coverage, clearly separating approved skills from AI-extracted suggestions awaiting human review.
