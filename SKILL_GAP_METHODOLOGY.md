# ProofHire 2.0 – Skill-Gap Analysis & Prioritization Methodology

## 1. Non-Zero Missing Data Principle
ProofHire never equates missing records with zero ability. Competency records are classified into distinct states:
- **`unknown`**: No competency record, evidence, or assessment history exists (`missing_skill`).
- **`unassessed`**: Student self-claimed or observed a skill without validated assessment (`evidence_required`).
- **`expired`**: Prior verification expired (`expires_at < now`), triggering `reassessment_recommended`.
- **`needs_improvement`**: Latest assessment scored `< 60%` or current proficiency is below role requirement.
- **`assessment_required`**: Evidence is linked (`evidence_linked`), awaiting validated machine assessment.
- **`meets_requirement`**: Satisfies target role proficiency and evidence level.

## 2. Deterministic Priority Scoring
Each gap is scored deterministically (`0–120+`) using configurable rules in `SkillGapService._compute_priority`:
1. **Role Importance (`importance * 40`)**: Weighted importance of the skill for the selected role.
2. **Mandatory Prerequisite (`+25`)**: Added if the skill is mandatory for the target role.
3. **Proficiency Delta (`delta * 10`)**: Tier difference between current (`Unknown=0, Beginner=1, Intermediate=2, Advanced=3`) and required proficiency.
4. **Downstream Dependency (`+15`)**: Added if other required skills depend on this skill as a prerequisite.
5. **Assessment Weakness (`+20`)**: Added if recent assessment scored `< 60%` or flagged weak topics.
6. **Existing Evidence Offset (`-10`)**: Reduced if the student already has linked evidence.

**Priority Tiers:**
- **Critical**: `score >= 80`
- **High**: `60 <= score < 80`
- **Medium**: `35 <= score < 60`
- **Low**: `score < 35`
