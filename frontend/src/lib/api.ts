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

  // Assessments
  async getAdaptiveQuestion(category = 'SQL', level = 2, excludeIds: string[] = []): Promise<Question | null> {
    const excludeParam = excludeIds.length ? `&exclude=${excludeIds.join(',')}` : '';
    return this.request(`/assessments/adaptive-question?category=${category}&level=${level}${excludeParam}`);
  }

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

  // Readiness
  async getReadiness(studentId = 'student-rahul-01', role = 'Backend'): Promise<ReadinessScore | null> {
    return this.request(`/readiness/student/${studentId}?role=${encodeURIComponent(role)}`);
  }

  // Learning Paths
  async getLearningPath(studentId = 'student-rahul-01', role = 'Backend'): Promise<LearningPath | null> {
    return this.request(`/learning/path/${studentId}?target_role=${encodeURIComponent(role)}`);
  }

  async completeTask(taskId: string, studentId = 'student-rahul-01') {
    return this.request('/learning/task/complete', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, student_id: studentId }),
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

  // University
  async getUniversitySummary(): Promise<{ colleges: UniversityCollege[]; tenant_policy: string } | null> {
    return this.request('/university/colleges-summary');
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
}

export const api = new ApiClient();
