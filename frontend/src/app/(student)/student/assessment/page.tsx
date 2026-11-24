'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import {
  AdaptiveQuestionPayload,
  StartAttemptResponse,
  AssessmentReportResponse,
} from '@/types';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Zap,
  Clock,
  Code2,
  Database,
  Cpu,
  Globe,
  Wrench,
  Bug,
  Users2,
  Play,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileCheck2,
  Table,
  HelpCircle,
  AlertTriangle,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const CATEGORIES_METADATA = [
  { name: 'DBMS', label: 'Database Management Systems', icon: <Database size={18} className="text-emerald-500" />, desc: 'SQL joins, schema design, ACID transactions, and indexing optimization', type: 'sql' },
  { name: 'Programming', label: 'Programming Fundamentals', icon: <Code2 size={18} className="text-blue-500" />, desc: 'Core syntax, control flow, functions, OOP, and memory management', type: 'programming' },
  { name: 'DSA', label: 'Data Structures & Algorithms', icon: <Cpu size={18} className="text-purple-500" />, desc: 'Arrays, balanced trees, graphs, sorting, and dynamic programming', type: 'programming' },
  { name: 'Aptitude', label: 'Quantitative & Logical Aptitude', icon: <Award size={18} className="text-amber-500" />, desc: 'Speed math, series completion, logical reasoning, and verbal analysis', type: 'mcq' },
  { name: 'Operating Systems', label: 'Operating Systems', icon: <Layers size={18} className="text-slate-500" />, desc: 'Process scheduling, deadlocks, virtual memory, paging, and concurrency', type: 'mcq' },
  { name: 'Computer Networks', label: 'Computer Networks', icon: <Globe size={18} className="text-cyan-500" />, desc: 'OSI 7-layer model, TCP/IP handshake, TLS 1.3, DNS, and subnetting', type: 'mcq' },
  { name: 'Web Development', label: 'Web Development & APIs', icon: <Globe size={18} className="text-indigo-500" />, desc: 'REST standards, CORS, JWT authentication, DOM lifecycle, and React', type: 'mcq' },
  { name: 'Frameworks & Tools', label: 'Frameworks & DevOps Tools', icon: <Wrench size={18} className="text-rose-500" />, desc: 'Git rebasing/branching, Docker containerization, and CI/CD pipelines', type: 'mcq' },
  { name: 'Debugging', label: 'Debugging & Code Correction', icon: <Bug size={18} className="text-red-500" />, desc: 'Identify off-by-one errors, resource leaks, and fix buggy implementations', type: 'debugging' },
  { name: 'Technical Interview', label: 'Technical Interview & System Design', icon: <Users2 size={18} className="text-teal-500" />, desc: 'Idempotency, CAP Theorem trade-offs, and architectural defenses', type: 'interview' },
];

export default function AssessmentPage() {
  const { setSkills, setEvidenceDescriptions, addTimelineItem, showToast } = useApp();

  // Mode: 'landing' | 'active' | 'report'
  const [mode, setMode] = useState<'landing' | 'active' | 'report'>('landing');

  // Assessment Selection
  const [selectedCategory, setSelectedCategory] = useState('DBMS');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState('sql');
  const [targetRole, setTargetRole] = useState('Backend Developer');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(5);

  // Active Assessment State
  const [attemptId, setAttemptId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestionPayload | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, any>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(900);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inputs for current question
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [codeEditor, setCodeEditor] = useState<string>('');
  const [sqlEditor, setSqlEditor] = useState<string>('');
  const [explanationInput, setExplanationInput] = useState<string>('');

  // Sandbox Test Execution State
  const [isRunningSandbox, setIsRunningSandbox] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // Outcome Report State
  const [report, setReport] = useState<AssessmentReportResponse | null>(null);
  const [historyAttempts, setHistoryAttempts] = useState<any[]>([]);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown Timer
  useEffect(() => {
    if (mode === 'active' && secondsRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmitOnExpiry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode, secondsRemaining]);

  // Load history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const hist = await api.getAssessmentIntelligence('student-rahul-01');
        if (hist) setHistoryAttempts(hist.persistent_weak_topics || []);
      } catch (err) {
        console.warn('Could not load history');
      }
    }
    loadHistory();
  }, []);

  const handleStartAssessment = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.startAssessment({
        student_id: 'student-rahul-01',
        category: selectedCategory,
        assessment_type: selectedAssessmentType,
        target_role: targetRole,
        time_limit_minutes: timeLimitMinutes,
        total_questions: totalQuestionsCount,
      });

      if (res && res.attempt_id) {
        setAttemptId(res.attempt_id);
        setCurrentQuestion(res.first_question || null);
        setQuestionIndex(0);
        setSecondsRemaining(res.time_limit_minutes * 60);
        setAnsweredMap({});
        setMarkedForReview({});
        resetInputs(res.first_question);
        setMode('active');
        showToast(`Assessment started! Timer set to ${res.time_limit_minutes} minutes.`);
      } else {
        showToast('Error starting assessment');
      }
    } catch {
      showToast('Failed to start assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetInputs = (q?: AdaptiveQuestionPayload | null) => {
    setSelectedOption(null);
    setCodeEditor(q?.starter_code || '');
    setSqlEditor(q?.starter_code || 'SELECT * FROM employees LIMIT 5;');
    setExplanationInput('');
    setSandboxResult(null);
  };

  const handleRunSandbox = async () => {
    if (!currentQuestion) return;
    setIsRunningSandbox(true);
    try {
      if (currentQuestion.question_type === 'sql') {
        const res = await api.executeSqlInSandbox({
          query: sqlEditor,
        });
        setSandboxResult(res);
        showToast(res && res.status === 'PASSED' ? 'SQL query executed successfully!' : 'SQL executed with errors');
      } else if (currentQuestion.question_type === 'coding' || currentQuestion.question_type === 'debugging') {
        const res = await api.executeCodeInSandbox({
          language: 'python',
          code: codeEditor,
          test_cases: currentQuestion.test_cases || [],
        });
        setSandboxResult(res);
        showToast(`Passed ${res ? res.passed_count : 0}/${res ? res.total_count : 0} test cases`);
      }
    } catch {
      showToast('Error executing in sandbox');
    } finally {
      setIsRunningSandbox(false);
    }
  };

  const handleSaveAndNext = async () => {
    if (!currentQuestion || !attemptId) return;

    setIsSubmitting(true);
    try {
      const res = await api.submitAssessmentAnswer({
        attempt_id: attemptId,
        student_id: 'student-rahul-01',
        question_id: currentQuestion.id,
        selected_option_index: selectedOption,
        code_submission: currentQuestion.question_type === 'coding' || currentQuestion.question_type === 'debugging' ? codeEditor : null,
        sql_query: currentQuestion.question_type === 'sql' ? sqlEditor : null,
        explanation: explanationInput,
        time_spent_seconds: 35,
      });

      // Record question answer in map
      setAnsweredMap((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          selectedOption,
          codeEditor,
          sqlEditor,
          explanationInput,
          isCorrect: res?.is_correct,
        },
      }));

      showToast(res?.feedback || 'Answer recorded securely on ledger.');

      if (res?.is_complete || questionIndex + 1 >= totalQuestionsCount || !res?.next_question) {
        // Complete the assessment
        await handleFinishAssessment();
      } else {
        // Move to next adaptive question
        setCurrentQuestion(res.next_question);
        setQuestionIndex((prev) => prev + 1);
        resetInputs(res.next_question);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error recording answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAssessment = async () => {
    if (!attemptId) return;
    setIsSubmitting(true);
    try {
      const rep = await api.completeAssessmentAttempt({
        attempt_id: attemptId,
        student_id: 'student-rahul-01',
      });

      if (rep) {
        setReport(rep);
        setMode('report');

        if (rep.passed) {
          setSkills((prev) => ({ ...prev, [rep.category]: Math.max(prev[rep.category] || 0, 3) }));
          setEvidenceDescriptions((prev) => ({
            ...prev,
            [rep.category]: `Adaptive assessment ${rep.total_score}/${rep.max_score} (${rep.percentage}%) · Assessed`,
          }));
          addTimelineItem(rep.category, 'Assessment Passed', `Scored ${rep.percentage}% on adaptive ${rep.category} test`);
          showToast(`Passed with ${rep.percentage}%! Competency updated to Assessed.`);
        } else {
          showToast(`Assessment finished with ${rep.percentage}%. Review recommendations.`);
        }
      }
    } catch {
      showToast('Error completing assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmitOnExpiry = async () => {
    showToast('Time expired! Automatically submitting assessment.');
    await handleFinishAssessment();
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // VIEW: LANDING & ASSESSMENT SELECTOR
  // -------------------------------------------------------------
  if (mode === 'landing') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Adaptive Placement Assessment Engine"
          description="Proctored machine-scored diagnostic platform with dynamic difficulty scaling, sandboxed code/SQL runners, and topic-level gap analysis."
          breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Adaptive Assessment' }]}
        />

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#2563eb] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-xs border border-white/20">
                <Sparkles size={12} className="text-amber-300" />
                Adaptive Item Response Engine
              </span>
              <h2 className="text-2xl font-black text-white">Diagnostic Competency Evaluation</h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                Strong performance elevates complexity in real-time; missed answers trigger prerequisite concept reinforcement. Passing with $\ge 60\%$ transitions competencies to <b className="text-emerald-300">Assessed</b> status.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartAssessment}
              disabled={isSubmitting}
              className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-extrabold text-sm shadow-sm hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Zap size={16} className="text-pri" />
              Launch Assessment
            </button>
          </div>
        </div>

        {/* 10 Assessment Categories Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Select Assessment Category</h2>
              <p className="text-xs text-mut">10 specialized engineering competency tracks aligned with recruiter requisitions</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pri/10 text-pri">
              10 Competency Tracks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES_METADATA.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setSelectedAssessmentType(cat.type);
                  }}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-card border-pri shadow-sm ring-2 ring-pri/20'
                      : 'bg-card border-line hover:border-pri/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-bg border border-line">
                        {cat.icon}
                      </div>
                      <h3 className="text-sm font-bold text-ink">{cat.name}</h3>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pri text-white">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-mut leading-relaxed">{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Assessment Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Target Career Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-xs font-semibold text-ink focus:outline-hidden"
              >
                <option value="Backend Developer">Backend Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Assessment Type</label>
              <select
                value={selectedAssessmentType}
                onChange={(e) => setSelectedAssessmentType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-xs font-semibold text-ink focus:outline-hidden"
              >
                <option value="mcq">Technical MCQ (Topic Scored)</option>
                <option value="sql">SQL Query & Schema Assessment</option>
                <option value="programming">Programming & Code Execution</option>
                <option value="debugging">Debugging & Problem Solving</option>
                <option value="interview">Technical Interview Defense</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Time Allocation</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-bg border border-line text-xs font-semibold text-ink flex items-center justify-between">
                <span>{timeLimitMinutes} Minutes</span>
                <span className="text-mut text-[11px] font-mono">{totalQuestionsCount} Questions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: ACTIVE ASSESSMENT INTERFACE
  // -------------------------------------------------------------
  if (mode === 'active' && currentQuestion) {
    const isMarked = markedForReview[currentQuestion.id];
    return (
      <div className="space-y-6">
        {/* Active Assessment Top Bar */}
        <div className="bg-card border border-line rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-pri/10 text-pri">
              {currentQuestion.category} · Question {questionIndex + 1} of {totalQuestionsCount}
            </span>
            <span className="text-xs font-semibold text-mut">Topic: <b className="text-ink">{currentQuestion.topic}</b></span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-bg border border-line text-amber-600">
              {currentQuestion.difficulty_str}
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Countdown Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold border border-rose-500/20">
              <Clock size={14} />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            <button
              type="button"
              onClick={() => setMarkedForReview((prev) => ({ ...prev, [currentQuestion.id]: !isMarked }))}
              className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isMarked
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-bg border border-line text-mut hover:text-ink'
              }`}
            >
              <Bookmark size={14} />
              {isMarked ? 'Marked' : 'Mark for Review'}
            </button>
          </div>
        </div>

        {/* Question & Interaction Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Question & Editor Area */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Question Text */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-mut block">
                  Problem Statement ({currentQuestion.marks} Marks)
                </span>
                <h2 className="text-base sm:text-lg font-bold text-ink leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* INTERFACE TYPE A: Multiple Choice Questions */}
              {currentQuestion.question_type === 'mcq' && (
                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-pri/5 border-pri text-ink ring-2 ring-pri/20'
                            : 'bg-bg border-line hover:border-line/80 text-ink'
                        }`}
                      >
                        <span className="text-xs font-semibold">{opt}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'bg-pri text-white border-pri' : 'border-line text-mut'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* INTERFACE TYPE B: SQL Assessment Editor */}
              {currentQuestion.question_type === 'sql' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-ink border-b border-line pb-2">
                    <span className="flex items-center gap-1.5"><Database size={14} className="text-pri" /> SQL Query Sandbox</span>
                    <button
                      type="button"
                      onClick={handleRunSandbox}
                      disabled={isRunningSandbox}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px] hover:opacity-95 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Play size={12} /> {isRunningSandbox ? 'Executing...' : 'Run Query'}
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={sqlEditor}
                    onChange={(e) => setSqlEditor(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-hidden border border-slate-800"
                  />

                  {sandboxResult && (
                    <div className="p-3.5 rounded-xl bg-bg border border-line space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>Query Execution Output</span>
                        <span className="text-pri font-mono text-[11px]">{sandboxResult.execution_time_ms} ms</span>
                      </div>
                      {sandboxResult.columns && sandboxResult.columns.length > 0 ? (
                        <div className="overflow-x-auto max-h-40 border border-line rounded-lg">
                          <table className="w-full text-[11px] text-left">
                            <thead className="bg-card border-b border-line font-bold text-ink">
                              <tr>
                                {sandboxResult.columns.map((c: string) => (
                                  <th key={c} className="p-2">{c}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sandboxResult.rows.map((row: any[], rIdx: number) => (
                                <tr key={rIdx} className="border-b border-line hover:bg-card">
                                  {row.map((val: any, cIdx: number) => (
                                    <td key={cIdx} className="p-2 font-mono">{String(val)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-rose-500 font-mono">{sandboxResult.error || '0 rows returned'}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* INTERFACE TYPE C: Programming / Coding Editor */}
              {(currentQuestion.question_type === 'coding' || currentQuestion.question_type === 'debugging') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-ink border-b border-line pb-2">
                    <span className="flex items-center gap-1.5"><Code2 size={14} className="text-pri" /> Python Code Sandbox</span>
                    <button
                      type="button"
                      onClick={handleRunSandbox}
                      disabled={isRunningSandbox}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px] hover:opacity-95 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Play size={12} /> {isRunningSandbox ? 'Evaluating...' : 'Run Test Cases'}
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={codeEditor}
                    onChange={(e) => setCodeEditor(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-950 text-blue-300 font-mono text-xs focus:outline-hidden border border-slate-800"
                  />

                  {currentQuestion.question_type === 'debugging' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink">Root Cause Explanation</label>
                      <textarea
                        rows={2}
                        placeholder="Explain what caused the bug and how your solution rectifies it..."
                        value={explanationInput}
                        onChange={(e) => setExplanationInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-bg border border-line text-xs font-medium text-ink focus:outline-hidden"
                      />
                    </div>
                  )}

                  {sandboxResult && (
                    <div className="p-3.5 rounded-xl bg-bg border border-line space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>Test Case Results: Passed {sandboxResult.passed_count}/{sandboxResult.total_count}</span>
                        <span className="font-mono text-[11px] text-pri">{sandboxResult.execution_time_ms} ms</span>
                      </div>
                      <div className="space-y-1.5">
                        {(sandboxResult.test_results || []).map((t: any) => (
                          <div key={t.test_case} className="flex justify-between items-center text-[11px] font-mono p-2 rounded bg-card border border-line">
                            <span>Test Case #{t.test_case}: {t.input}</span>
                            <span className={t.passed ? 'text-ok font-bold' : 'text-rose-500 font-bold'}>
                              {t.passed ? 'PASSED ✓' : 'FAILED ✕'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* INTERFACE TYPE D: Technical Interview Structured Response */}
              {currentQuestion.question_type === 'interview' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-line pb-2">
                    <span className="text-xs font-bold text-ink">Architectural & Behavioral Defense</span>
                    <span className="text-[11px] text-mut">Word count: {explanationInput.trim().split(/\s+/).filter(Boolean).length}</span>
                  </div>
                  <textarea
                    rows={6}
                    placeholder="Provide a comprehensive technical response detailing architectural decisions, failure modes, and trade-offs..."
                    value={explanationInput}
                    onChange={(e) => setExplanationInput(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-bg border border-line text-xs text-ink leading-relaxed focus:outline-hidden"
                  />
                  <div className="p-3 rounded-xl bg-bg border border-line text-[11px] text-mut space-y-1">
                    <b className="text-ink block">Evaluation Rubric:</b>
                    <span>1. Architectural trade-off analysis. 2. Edge case and failure handling. 3. System scalability guarantees.</span>
                  </div>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-line flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleFinishAssessment}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  Submit Assessment
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-pri text-white shadow-xs hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : questionIndex + 1 >= totalQuestionsCount ? 'Save & Finalize' : 'Save & Next'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Question Palette Drawer */}
          <div className="space-y-4">
            <div className="bg-card border border-line rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Question Drawer</h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: totalQuestionsCount }).map((_, idx) => {
                  const isCurrent = idx === questionIndex;
                  const isAnswered = idx < questionIndex;
                  return (
                    <div
                      key={idx}
                      className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold border transition-all ${
                        isCurrent
                          ? 'bg-pri text-white border-pri shadow-xs'
                          : isAnswered
                          ? 'bg-okt text-ok border-ok/20'
                          : 'bg-bg text-mut border-line'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5 text-[11px] text-mut pt-2 border-t border-line">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-pri" />
                  <span>Current Question</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-ok" />
                  <span>Answered & Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>Unvisited</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: DIAGNOSTIC REPORT OUTCOME
  // -------------------------------------------------------------
  if (mode === 'report' && report) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Assessment Outcome & Diagnostic Report"
          description="Proctored machine-validated evaluation result with adaptive difficulty progression."
          breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Assessment Outcome' }]}
          actions={
            <div className="flex items-center gap-2">
              <Link
                href="/student/readiness"
                className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
              >
                <TrendingUp size={14} />
                View Updated Readiness
              </Link>
            </div>
          }
        />

        {/* Score Summary Banner */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 ${
          report.passed
            ? 'bg-okt border-ok/30 text-ink'
            : 'bg-amber-500/10 border-amber-500/30 text-ink'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                report.passed ? 'bg-ok text-white' : 'bg-amber-500 text-white'
              }`}>
                {report.passed ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                {report.passed ? 'Assessment Passed (Threshold: 60%)' : 'Needs Practice (Threshold: 60%)'}
              </span>
              <h2 className="text-2xl font-black tracking-tight text-ink">
                {report.category} Diagnostic Score: {report.percentage}%
              </h2>
              <p className="text-xs sm:text-sm text-mut leading-relaxed max-w-xl">
                {report.summary}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-4xl font-black text-ink">{report.total_score}/{report.max_score}</span>
              <span className="block text-xs text-mut font-semibold">Earned Marks</span>
            </div>
          </div>
        </div>

        {/* Breakdown Row: Topic-wise and Difficulty-wise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topic Performance */}
          <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-line pb-3">
              <h3 className="text-sm font-bold text-ink">Topic-Level Diagnostic Breakdown</h3>
              <p className="text-xs text-mut">Precision scoring across evaluated sub-competency areas</p>
            </div>

            <div className="space-y-3.5">
              {Object.entries(report.topic_scores).map(([topic, stats]) => (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-ink">{topic}</span>
                    <span className="font-mono text-pri font-bold">{stats.percentage}%</span>
                  </div>
                  <ProgressBar value={stats.percentage} color={stats.percentage >= 70 ? 'success' : stats.percentage < 60 ? 'danger' : 'primary'} />
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Performance */}
          <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-line pb-3">
              <h3 className="text-sm font-bold text-ink">Difficulty Level Progression</h3>
              <p className="text-xs text-mut">Performance calibrated across adaptive complexity tiers</p>
            </div>

            <div className="space-y-3.5">
              {Object.entries(report.difficulty_scores).map(([lvl, stats]) => (
                <div key={lvl} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-ink">{lvl}</span>
                    <span className="font-mono text-ink font-bold">{stats.percentage}%</span>
                  </div>
                  <ProgressBar value={stats.percentage} color="primary" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Identified Strong & Weak Areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-ok/20 space-y-2">
            <div className="flex items-center gap-2 text-ok font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 size={15} /> Demonstrated Strong Areas
            </div>
            {report.strong_topics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {report.strong_topics.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-okt text-ok text-xs font-bold">
                    {t} ✓
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-mut italic">No topics reached 70% threshold in this session.</p>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-card border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
              <AlertCircle size={15} /> Identified Weak Topics
            </div>
            {report.weak_topics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {report.weak_topics.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 text-xs font-bold">
                    {t} ✕
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ok font-semibold">Zero critical gap areas detected!</p>
            )}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Actionable Learning Roadmap</h3>
          <ul className="space-y-2 text-xs text-mut">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-pri font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => setMode('landing')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-card border border-line text-ink hover:bg-bg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} /> Retake or Select Category
          </button>
          <Link
            href="/student/readiness"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-pri text-white shadow-xs hover:opacity-95 transition-opacity"
          >
            Inspect Target Role Readiness →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
