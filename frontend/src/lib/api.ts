import {
  StudentProfile,
  ReadinessScore,
  Question,
  LearningPath,
  EligibilityResult,
  CalendarResponse,
  RecruiterCandidate,
  PipelineCandidate,
  ApprovalItem,
  CohortInsights,
  UniversityCollege,
  AuditResponse,
  EvidenceItem,
  StudentDashboardSummary,
  CategorizedSkill,
  MentorVerificationRequestItem,
  GitHubRepoItem,
  StudentPrivacyResponse,
  StudentDriveItem,
  ResumeDataResponse,
  AdaptiveQuestionPayload,
  StartAttemptResponse,
  SubmitAnswerResponse,
  AssessmentReportResponse,
  RoleComparisonResponse,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined'
      ? (window.location.origin.includes('localhost:3000') ? 'http://localhost:8000' : API_BASE)
      : API_BASE;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    try {
      const url = `${this.baseUrl}/api${endpoint}`;
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
        ...options,
      });

      if (!res.ok) {
        console.warn(`API Error [${res.status}] for ${endpoint}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      console.warn(`API Unreachable: ${endpoint}. Falling back to state data.`);
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Student & Competencies
  async getStudentProfile(studentId = 'student-rahul-01'): Promise<{ student: StudentProfile; competencies: any[] } | null> {
    return this.request(`/competencies/student/${studentId}`);
  }

  async getStudentDashboardSummary(studentId = 'student-rahul-01'): Promise<StudentDashboardSummary | null> {
    return this.request(`/student/${studentId}/dashboard-summary`);
  }

  async getCompetencyCategories(studentId = 'student-rahul-01'): Promise<{ student_id: string; categories: Record<string, CategorizedSkill[]> } | null> {
    return this.request(`/competencies/student/${studentId}/categories`);
  }

  async claimSkill(payload: {
    student_id: string;
    skill_name: string;
    category?: string;
    proficiency?: string;
  }) {
    return this.request('/competencies/claim', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getStudentEvidence(studentId = 'student-rahul-01'): Promise<EvidenceItem[] | null> {
    return this.request(`/competencies/student/${studentId}/evidence`);
  }

  async addEvidence(payload: {
    student_id: string;
    skill_name: string;
    kind: string;
    title: string;
    ref_url: string;
    confidence?: number;
  }) {
    return this.request('/competencies/evidence', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteEvidence(evidenceId: string, studentId = 'student-rahul-01') {
    return this.request(`/competencies/evidence/${evidenceId}?student_id=${studentId}`, {
      method: 'DELETE',
    });
  }

  async createMentorVerificationRequest(payload: {
    student_id: string;
    skill_name: string;
    mentor_name: string;
    evidence_summary: string;
    walkthrough_notes?: string;
  }) {
    return this.request('/competencies/mentor/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMentorVerificationRequests(studentId = 'student-rahul-01'): Promise<MentorVerificationRequestItem[] | null> {
    return this.request(`/competencies/mentor/requests/${studentId}`);
  }

  async adjudicateMentorRequest(payload: {
    request_id: string;
    mentor_name: string;
    approved: boolean;
    notes?: string;
  }) {
    return this.request('/competencies/mentor/adjudicate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async signOffMentor(payload: {
    student_id: string;
    skill_name: string;
    mentor_name: string;
    notes?: string;
  }) {
    return this.request('/competencies/mentor-signoff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async scanGitHub(studentId = 'student-rahul-01', username = 'rahulk-dev') {
    return this.request(`/competencies/github/scan?student_id=${studentId}&username=${username}`, {
      method: 'POST',
    });
  }

  async getGitHubRepositories(studentId = 'student-rahul-01'): Promise<GitHubRepoItem[] | null> {
    return this.request(`/competencies/github/repositories/${studentId}`);
  }

  async revokeGitHub(studentId = 'student-rahul-01') {
    return this.request(`/competencies/github/revoke?student_id=${studentId}`, {
      method: 'POST',
    });
  }

  // Student Privacy & DPDP
  async getStudentPrivacy(studentId = 'student-rahul-01'): Promise<StudentPrivacyResponse | null> {
    return this.request(`/student/${studentId}/privacy`);
  }

  async updateStudentConsent(studentId = 'student-rahul-01', purpose: string, granted: boolean) {
    return this.request(`/student/${studentId}/consent`, {
      method: 'POST',
      body: JSON.stringify({ purpose, granted }),
    });
  }

  // Student Resume Generator
  async getResumeData(studentId = 'student-rahul-01'): Promise<ResumeDataResponse | null> {
    return this.request(`/student/${studentId}/resume-data`);
  }

  async saveResumeSnapshot(studentId = 'student-rahul-01', templateName = 'Modern Tech', title = 'Software Engineering Resume') {
    return this.request(`/student/${studentId}/resume/save`, {
      method: 'POST',
      body: JSON.stringify({ template_name: templateName, title }),
    });
  }

  // Student Placement Drives
  async getStudentDrives(studentId = 'student-rahul-01'): Promise<StudentDriveItem[] | null> {
    return this.request(`/student/${studentId}/drives`);
  }

  async applyToDrive(studentId = 'student-rahul-01', driveId: string) {
    return this.request(`/student/${studentId}/drives/apply`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, drive_id: driveId }),
    });
  }

  async appealDriveDecision(studentId = 'student-rahul-01', driveId: string, reason: string) {
    return this.request(`/student/${studentId}/drives/appeal`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, drive_id: driveId, reason }),
    });
  }

  // Assessments & Adaptive Diagnostic Engine
  async getAssessmentCategories(): Promise<string[] | null> {
    return this.request('/assessments/categories');
  }

  async startAssessment(payload: {
    student_id: string;
    category: string;
    assessment_type?: string;
    target_role?: string;
    time_limit_minutes?: number;
    total_questions?: number;
  }): Promise<StartAttemptResponse | null> {
    return this.request('/assessments/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdaptiveQuestion(category = 'DBMS', level = 2, excludeIds: string[] = []): Promise<AdaptiveQuestionPayload | null> {
    const excludeParam = excludeIds.length ? `&exclude=${excludeIds.join(',')}` : '';
    return this.request(`/assessments/adaptive-question?category=${encodeURIComponent(category)}&level=${level}${excludeParam}`);
  }

  async submitAssessmentAnswer(payload: {
    attempt_id: string;
    student_id: string;
    question_id: string;
    selected_option_index?: number | null;
    code_submission?: string | null;
    sql_query?: string | null;
    explanation?: string | null;
    time_spent_seconds?: number;
  }): Promise<SubmitAnswerResponse | null> {
    return this.request('/assessments/submit-answer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async completeAssessmentAttempt(payload: {
    attempt_id: string;
    student_id: string;
  }): Promise<AssessmentReportResponse | null> {
    return this.request('/assessments/complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAssessmentReport(attemptId: string, studentId = 'student-rahul-01'): Promise<AssessmentReportResponse | null> {
    return this.request(`/assessments/report/${attemptId}?student_id=${studentId}`);
  }

  async getAssessmentIntelligence(studentId = 'student-rahul-01', category?: string): Promise<any | null> {
    const catParam = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request(`/assessments/intelligence/${studentId}${catParam}`);
  }

  async executeCodeInSandbox(payload: {
    language: string;
    code: string;
    test_cases: Array<{ input: string; expected_output: string; is_hidden?: boolean }>;
  }): Promise<{ status: string; score: number; passed_count: number; total_count: number; test_results?: any[]; error?: string; execution_time_ms: number } | null> {
    return this.request('/assessments/execute-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async executeSqlInSandbox(payload: {
    query: string;
    expected_output?: string;
  }): Promise<{ status: string; score: number; columns: string[]; rows: any[][]; error?: string; execution_time_ms: number } | null> {
    return this.request('/assessments/execute-sql', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Legacy assessment compatibility helper
  async submitAnswer(payload: {
    student_id: string;
    category: string;
    question_id: string;
    selected_option_index: number;
    current_difficulty: number;
  }) {
    return this.request('/assessments/submit-answer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async completeAssessment(studentId = 'student-rahul-01', category = 'SQL', score: number, total = 5) {
    return this.request(`/assessments/complete?student_id=${studentId}&category=${category}&score=${score}&total=${total}`, {
      method: 'POST',
    });
  }

  // Placement Readiness Index & Role Comparison
  async getReadiness(studentId = 'student-rahul-01', role = 'Backend Developer'): Promise<ReadinessScore | null> {
    return this.request(`/readiness/student/${studentId}?role=${encodeURIComponent(role)}`);
  }

  async compareTargetRoles(studentId = 'student-rahul-01'): Promise<RoleComparisonResponse | null> {
    return this.request(`/readiness/student/${studentId}/compare`);
  }

  // Learning Paths & Skill-Gap Closure Engine (Phase 5)
  async getTargetRoles(): Promise<Array<{ role_name: string; required_skill_count: number; mandatory_skills: string[] }> | null> {
    return this.request('/learning/roles');
  }

  async getSkillGaps(studentId = 'student-rahul-01', role = 'Backend Developer'): Promise<any | null> {
    return this.request(`/learning/gaps/${studentId}?target_role=${encodeURIComponent(role)}`);
  }

  async getLearningPath(studentId = 'student-rahul-01', role = 'Backend Developer', forceRegenerate = false): Promise<any | null> {
    return this.request(`/learning/path/${studentId}?target_role=${encodeURIComponent(role)}&force_regenerate=${forceRegenerate}`);
  }

  async updateTaskProgress(payload: {
    task_id: string;
    student_id: string;
    status: string;
    time_spent_minutes?: number;
  }): Promise<{ success: boolean; task: any; note?: string } | null> {
    return this.request('/learning/task/progress', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async submitTaskEvidence(payload: {
    task_id: string;
    student_id: string;
    artifact_type: string;
    artifact_url: string;
    notes?: string;
  }): Promise<{ success: boolean; submission_id: string; evidence_id?: string; competency_state: string; task_status: string; message?: string } | null> {
    return this.request('/learning/task/submit-evidence', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getRecommendedProjects(role = 'Backend Developer'): Promise<{ target_role: string; projects: any[] } | null> {
    return this.request(`/learning/projects?target_role=${encodeURIComponent(role)}`);
  }

  async getLearningProgress(studentId = 'student-rahul-01', role = 'Backend Developer'): Promise<any | null> {
    return this.request(`/learning/progress/${studentId}?target_role=${encodeURIComponent(role)}`);
  }

  async requestReassessment(payload: { student_id: string; skill_name: string; target_role?: string }) {
    return this.request('/learning/reassessment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async completeTask(taskId: string, studentId = 'student-rahul-01') {
    return this.request('/learning/task/complete', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, student_id: studentId }),
    });
  }

  // Officer Cohort Skill-Gap & Training Interventions
  async getCohortSkillGaps(collegeId = 'COLLEGE-A', targetRole = 'Backend Developer'): Promise<any | null> {
    return this.request(`/officer/cohort-skill-gaps?college_id=${collegeId}&target_role=${encodeURIComponent(targetRole)}`);
  }

  async getInterventions(collegeId = 'COLLEGE-A'): Promise<any[] | null> {
    return this.request(`/officer/interventions?college_id=${collegeId}`);
  }

  async createIntervention(payload: {
    college_id: string;
    created_by?: string;
    title: string;
    description?: string;
    target_role: string;
    target_skills: string[];
  }): Promise<{ id: string; title: string; target_role: string; status: string } | null> {
    return this.request('/officer/interventions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async assignInterventionStudents(interventionId: string, payload: {
    college_id: string;
    student_ids: string[];
    actor?: string;
  }): Promise<{ intervention_id: string; assigned_students: string[] } | null> {
    return this.request(`/officer/interventions/${interventionId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Eligibility & Drives
  async checkEligibility(rules: any, student: any): Promise<EligibilityResult | null> {
    return this.request('/eligibility/check', {
      method: 'POST',
      body: JSON.stringify({ rules, student }),
    });
  }

  async submitAppeal(decisionId: string, studentId: string, reason: string) {
    return this.request('/eligibility/appeal', {
      method: 'POST',
      body: JSON.stringify({ decision_id: decisionId, student_id: studentId, reason }),
    });
  }

  // Phase 6: Company, Job, Eligibility Versioning, Matching, Drives & Communications
  async listCompanies(): Promise<any[] | null> {
    return this.request('/companies/');
  }

  async createCompany(payload: { name: string; industry: string; description?: string; website?: string; recruiter_contact?: string; college_id?: string }): Promise<{ id: string; name: string; industry: string } | null> {
    return this.request('/companies/', { method: 'POST', body: JSON.stringify(payload) });
  }

  async createJobOpportunity(payload: {
    company_id: string;
    title: string;
    description?: string;
    min_cgpa?: number;
    max_backlogs?: number;
    required_skills?: string[];
    preferred_skills?: string[];
    college_id?: string;
  }): Promise<{ id: string; title: string; status: string; required_skills: string[]; ai_extracted_skills: string[] } | null> {
    return this.request('/companies/jobs', { method: 'POST', body: JSON.stringify(payload) });
  }

  async createCampusDrive(payload: {
    college_id: string;
    company_id: string;
    job_role_id: string;
    title: string;
    day_of_week?: string;
    activity?: string;
    time_slot?: string;
    room?: string;
    publish_immediately?: boolean;
  }): Promise<{ id: string; title: string; published: boolean; status: string; has_clash: boolean } | null> {
    return this.request('/companies/drives', { method: 'POST', body: JSON.stringify(payload) });
  }

  async listAppeals(collegeId = 'COLLEGE-A'): Promise<any[] | null> {
    return this.request(`/eligibility/appeals?college_id=${collegeId}`);
  }

  async reviewAppeal(appealId: string, payload: {
    college_id: string;
    officer_name?: string;
    action: 'approved' | 'rejected' | 'clarification_requested';
    reviewer_notes?: string;
    corrected_data?: Record<string, any>;
  }): Promise<{ appeal_id: string; status: string } | null> {
    return this.request(`/eligibility/appeals/${appealId}/review`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async getStudentMatches(studentId = 'student-rahul-01'): Promise<any[] | null> {
    return this.request(`/eligibility/match/student/${studentId}`);
  }

  async getJobMatches(jobRoleId: string, collegeId = 'COLLEGE-A'): Promise<any | null> {
    return this.request(`/eligibility/match/job/${jobRoleId}?college_id=${collegeId}`);
  }

  async scheduleInterview(payload: {
    drive_id: string;
    application_id: string;
    college_id: string;
    round_name: string;
    interviewer: string;
    scheduled_date: string;
    time_slot: string;
    room: string;
  }): Promise<{ schedule_id: string; status: string } | null> {
    return this.request('/companies/interviews/schedule', { method: 'POST', body: JSON.stringify(payload) });
  }

  async submitRecruiterFeedback(payload: {
    application_id: string;
    college_id: string;
    recruiter_name?: string;
    round_name: string;
    rating: number;
    strengths: string;
    concerns: string;
    recommendation: string;
  }): Promise<{ feedback_id: string; is_private: boolean } | null> {
    return this.request('/recruiter/feedback', { method: 'POST', body: JSON.stringify(payload) });
  }

  async recordSelectionDecision(payload: {
    application_id: string;
    college_id: string;
    decision: string;
    package_ctc?: string;
    notes?: string;
  }): Promise<{ decision_id: string; decision: string } | null> {
    return this.request('/recruiter/selection-decision', { method: 'POST', body: JSON.stringify(payload) });
  }

  async previewBulkEmail(payload: {
    college_id: string;
    audience_filter: string;
    template_type: string;
    drive_title: string;
  }): Promise<{ recipient_count: number; recipients: any[]; subject: string; body: string; provider_mode: string } | null> {
    return this.request('/officer/communications/preview', { method: 'POST', body: JSON.stringify(payload) });
  }

  async sendBulkCommunication(payload: {
    college_id: string;
    audience_filter: string;
    template_type: string;
    drive_title: string;
  }): Promise<{ log_id: string; status: string; provider_mode: string; recipient_count: number; message: string } | null> {
    return this.request('/officer/communications/send', { method: 'POST', body: JSON.stringify(payload) });
  }

  async getCommunicationLogs(collegeId = 'COLLEGE-A'): Promise<any[] | null> {
    return this.request(`/officer/communications/logs?college_id=${collegeId}`);
  }

  async getPlacementAnalytics(collegeId = 'COLLEGE-A'): Promise<any | null> {
    return this.request(`/officer/placement-analytics?college_id=${collegeId}`);
  }

  // Calendar & Clash
  async getDriveCalendar(collegeId = 'COLLEGE-A'): Promise<CalendarResponse | null> {
    return this.request(`/companies/drives?college_id=${collegeId}`);
  }

  async resolveClash(driveTitle = 'Beta Soft', newDay = 'Thu', collegeId = 'COLLEGE-A') {
    return this.request(`/companies/drives/resolve-clash?drive_title=${encodeURIComponent(driveTitle)}&new_day=${newDay}&college_id=${collegeId}`, {
      method: 'POST',
    });
  }

  // Recruiter
  async searchTalent(skill = 'SQL', collegeId = 'COLLEGE-A'): Promise<RecruiterCandidate[] | null> {
    return this.request(`/recruiter/talent-search?skill=${encodeURIComponent(skill)}&college_id=${collegeId}`);
  }

  async getPipeline(collegeId = 'COLLEGE-A'): Promise<PipelineCandidate[] | null> {
    return this.request(`/recruiter/pipeline?college_id=${collegeId}`);
  }

  async advancePipeline(applicationId: string, officerApproval = false) {
    return this.request('/recruiter/pipeline/advance', {
      method: 'POST',
      body: JSON.stringify({ application_id: applicationId, officer_approval: officerApproval }),
    });
  }

  // Officer
  async getCohortInsights(collegeId = 'COLLEGE-A'): Promise<CohortInsights | null> {
    return this.request(`/officer/cohort-insights?college_id=${collegeId}`);
  }

  async getApprovals(collegeId = 'COLLEGE-A'): Promise<ApprovalItem[] | null> {
    return this.request(`/officer/approvals?college_id=${collegeId}`);
  }

  async actOnApproval(approvalId: string, action: 'approved' | 'rejected', officerName = 'T&P Officer') {
    return this.request('/officer/approvals/action', {
      method: 'POST',
      body: JSON.stringify({ approval_id: approvalId, action, officer_name: officerName }),
    });
  }

  async exportReport(collegeId = 'COLLEGE-A') {
    return this.request(`/officer/export-report?college_id=${collegeId}`);
  }

  // Phase 7: Institutional Intelligence & Accreditation Reporting
  async getInstitutionalOverview(collegeId = 'COLLEGE-A', branch = 'ALL', reportingPeriod = '2025-2026'): Promise<any | null> {
    return this.request(`/intelligence/overview?college_id=${collegeId}&branch=${encodeURIComponent(branch)}&reporting_period=${encodeURIComponent(reportingPeriod)}`);
  }

  async getMetricDefinitions(): Promise<any[] | null> {
    return this.request('/intelligence/metric-definitions');
  }

  async getIndustrySkillDemand(collegeId = 'COLLEGE-A'): Promise<any | null> {
    return this.request(`/intelligence/industry-demand?college_id=${collegeId}`);
  }

  async getPredictiveInsights(collegeId = 'COLLEGE-A'): Promise<any | null> {
    return this.request(`/intelligence/predictive-insights?college_id=${collegeId}`);
  }

  async getPlacementPerformance(collegeId = 'COLLEGE-A'): Promise<any | null> {
    return this.request(`/intelligence/placement-performance?college_id=${collegeId}`);
  }

  async generateInstitutionalReport(payload: {
    college_id: string;
    report_type: string;
    reporting_period: string;
    generated_by?: string;
  }): Promise<any | null> {
    return this.request('/intelligence/reports/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listInstitutionalReports(collegeId = 'COLLEGE-A'): Promise<any[] | null> {
    return this.request(`/intelligence/reports?college_id=${collegeId}`);
  }

  // University
  async getUniversitySummary(): Promise<{ colleges: UniversityCollege[]; tenant_policy: string } | null> {
    return this.request('/university/colleges-summary');
  }

  async getAuthorizedUniversityOverview(): Promise<any | null> {
    return this.request('/university/authorized-overview');
  }

  // Audit
  async getAuditTrail(collegeId = 'COLLEGE-A'): Promise<AuditResponse | null> {
    return this.request(`/audit/${collegeId}`);
  }

  async simulateTampering(collegeId = 'COLLEGE-A') {
    return this.request(`/audit/${collegeId}/tamper`, {
      method: 'POST',
    });
  }

  // Phase 8: Governance, DPDP Privacy, Consent, Fairness & Tamper-Evident Audit
  async getGovernanceConsents(studentId: string): Promise<any[] | null> {
    return this.request(`/governance/consent/${studentId}`);
  }

  async setGovernanceConsent(studentId: string, purpose: string, granted: boolean, policyVersion = 'v2.0'): Promise<any | null> {
    return this.request('/governance/consent', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, purpose, granted, policy_version: policyVersion }),
    });
  }

  async getPrivacyNotice(): Promise<any | null> {
    return this.request('/governance/privacy-notice');
  }

  async submitPrivacyRequest(studentId: string, requestType: string, reason: string): Promise<any | null> {
    return this.request('/governance/privacy-requests', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, request_type: requestType, reason }),
    });
  }

  async listPrivacyRequests(studentId: string): Promise<any[] | null> {
    return this.request(`/governance/privacy-requests/${studentId}`);
  }

  async getDataAccessLogs(studentId: string): Promise<any[] | null> {
    return this.request(`/governance/access-logs/${studentId}`);
  }

  async runFairnessAudit(collegeId = 'COLLEGE-A', reviewerName = 'Placement Officer'): Promise<any | null> {
    return this.request(`/governance/fairness/audit?college_id=${encodeURIComponent(collegeId)}&reviewer_name=${encodeURIComponent(reviewerName)}`, {
      method: 'POST',
    });
  }

  async listFairnessReports(collegeId = 'COLLEGE-A'): Promise<any[] | null> {
    return this.request(`/governance/fairness/reports?college_id=${encodeURIComponent(collegeId)}`);
  }

  async verifyAuditChainDetailed(collegeId = 'COLLEGE-A'): Promise<any | null> {
    return this.request(`/governance/audit/${encodeURIComponent(collegeId)}/verify`, {
      method: 'POST',
    });
  }

  async createAuditCheckpoint(collegeId = 'COLLEGE-A'): Promise<any | null> {
    return this.request(`/governance/audit/${encodeURIComponent(collegeId)}/checkpoint`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
