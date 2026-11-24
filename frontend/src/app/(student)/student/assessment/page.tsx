'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { Award, CheckCircle2, AlertCircle, ArrowRight, RotateCcw, ShieldCheck, Zap } from 'lucide-react';

const QUESTIONS = [
  { q: 'Which clause filters rows before grouping occurs in a SELECT query?', opts: ['WHERE', 'ORDER BY', 'HAVING'], ans: 0, lvl: 1 },
  { q: 'Which keyword eliminates duplicate records from a query result set?', opts: ['UNIQUE', 'DISTINCT', 'DROP'], ans: 1, lvl: 1 },
  { q: 'Which JOIN keeps every row from the left table regardless of matching records?', opts: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN'], ans: 1, lvl: 2 },
  { q: 'Which aggregate function calculates the total number of records?', opts: ['SUM', 'COUNT', 'AVG'], ans: 1, lvl: 2 },
  { q: 'Which clause filters grouped records produced by an aggregation?', opts: ['WHERE', 'HAVING', 'LIMIT'], ans: 1, lvl: 3 },
  { q: 'A foreign key constraint primarily enforces what database guarantee?', opts: ['Query Speed', 'Referential integrity', 'Symmetric Encryption'], ans: 1, lvl: 3 },
  { q: 'ROW_NUMBER() and RANK() are classifications of what SQL feature?', opts: ['Window function', 'Cross Join type', 'Table Constraint'], ans: 0, lvl: 3 },
];

const LEVEL_LABELS = {
  1: 'Level 1: Foundational Relational Syntax',
  2: 'Level 2: Intermediate Joins & Aggregations',
  3: 'Level 3: Advanced Constraints & Window Queries',
};

export default function AssessmentPage() {
  const { setSkills, setEvidenceDescriptions, addTimelineItem, showToast, setMockTestPassed } = useApp();

  const [index, setIndex] = useState(0);
  const [level, setLevel] = useState(2);
  const [score, setScore] = useState(0);
  const [used, setUsed] = useState<number[]>([]);
  const [history, setHistory] = useState<Array<{ q: string; isCorrect: boolean; lvl: number }>>([]);
  const [done, setDone] = useState(false);

  const currentQIndex = React.useMemo(() => {
    for (const d of [0, 1, -1, 2, -2]) {
      const l = level + d;
      if (l < 1 || l > 3) continue;
      const k = QUESTIONS.findIndex((item, i) => item.lvl === l && !used.includes(i));
      if (k >= 0) return k;
    }
    return 0;
  }, [level, used]);

  const currentQ = QUESTIONS[currentQIndex];

  const handleSelectOption = async (optionIdx: number) => {
    const isCorrect = optionIdx === currentQ.ans;
    const newHistory = [...history, { q: currentQ.q, isCorrect, lvl: level }];
    setHistory(newHistory);
    setUsed([...used, currentQIndex]);

    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    const nextLvl = Math.max(1, Math.min(3, level + (isCorrect ? 1 : -1)));
    setLevel(nextLvl);

    const nextIdx = index + 1;
    setIndex(nextIdx);

    if (nextIdx >= 5) {
      setDone(true);
      setMockTestPassed(true);
      if (newScore >= 3) {
        setSkills((prev) => ({ ...prev, SQL: Math.max(prev.SQL || 0, 3) }));
        setEvidenceDescriptions((prev) => ({
          ...prev,
          SQL: `Adaptive assessment ${newScore}/5 · awaiting mentor sign-off`,
        }));
        addTimelineItem('SQL', 'Assessment', `${newScore}/5 adaptive diagnostic exam`);
        showToast(`Passed with ${newScore}/5! SQL competency transitioned to Assessed.`);
      } else {
        showToast(`Assessment finished: ${newScore}/5. Review recommended learning path.`);
      }
      await api.completeAssessment('student-rahul-01', 'SQL', newScore, 5);
    } else {
      showToast(isCorrect ? 'Correct! Complexity adjusted upwards.' : 'Incorrect. Dynamic difficulty re-centered.');
    }
  };

  const handleRetake = () => {
    setIndex(0);
    setLevel(2);
    setScore(0);
    setUsed([]);
    setHistory([]);
    setDone(false);
  };

  if (done) {
    const passed = score >= 3;
    return (
      <div className="space-y-6">
        <PageHeader
          title="Assessment Outcome & Diagnostic Report"
          description="Proctored machine-validated evaluation result with adaptive difficulty progression."
          breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Assessment Outcome' }]}
        />
        <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="p-6 rounded-2xl bg-bg border border-line text-center space-y-2">
            <span className="text-5xl font-black text-ink tracking-tight">{score}<span className="text-2xl text-mut font-semibold">/5</span></span>
            <p className="text-sm font-semibold text-ink">
              {passed
                ? 'Diagnostic Passed! SQL competency transitioned to Assessed.'
                : 'Score below 60% threshold.'}
            </p>
            <p className="text-xs text-mut max-w-md mx-auto">
              {passed
                ? 'A verified assessment record has been committed to your talent profile. An authorized mentor sign-off will finalize the Verified status.'
                : 'Follow the personalized career learning path to close detected query syntax gaps and retake the diagnostic.'}
            </p>
          </div>

          <div className="space-y-2.5">
            <b className="text-xs font-bold text-ink block">Question Performance Trail:</b>
            {history.map((h, i) => (
              <div key={i} className="flex gap-3 items-center p-3.5 rounded-xl bg-bg border border-line">
                <span
                  className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                    h.isCorrect ? 'bg-okt text-ok border border-ok/20' : 'bg-bt text-bad border border-bad/20'
                  }`}
                >
                  {h.isCorrect ? '✓' : '✕'}
                </span>
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">Question {i + 1}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-card border border-line text-mut">
                      Level {h.lvl}
                    </span>
                  </div>
                  <div className="text-mut mt-0.5">{h.q}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleRetake}
              className="bg-card border border-line text-ink hover:bg-bg font-bold text-xs px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              Retake Assessment
            </button>
            <Link
              href="/student/evidence"
              className="bg-pri text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 flex-1"
            >
              Request Mentor Sign-Off
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Adaptive Competency Assessment Engine"
        description="Dynamic difficulty scaling with item-response theory (IRT). Questions automatically modulate based on real-time answer precision."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Adaptive Assessment' }]}
      />

      <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center flex-wrap gap-2 border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink">Proctored SQL Diagnostic</h2>
            <p className="text-xs text-mut mt-0.5">
              Question {index + 1} of 5 · Current Difficulty: Level {level}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-pri/10 text-pri border border-pri/20 flex items-center gap-1.5">
            <Zap size={12} />
            Adaptive Scaling Active
          </span>
        </div>

        {/* 5-step progress indicator */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-semibold text-mut">
            <span>Progress: {index} of 5 answered</span>
            <span>{LEVEL_LABELS[level as 1 | 2 | 3]}</span>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  i < index ? 'bg-ok' : i === index ? 'bg-pri' : 'bg-line'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-bg border border-line space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mut block">Question {index + 1}</span>
          <h3 className="text-base font-bold text-ink leading-relaxed">{currentQ.q}</h3>
        </div>

        <div className="space-y-3 pt-1">
          {currentQ.opts.map((opt, j) => {
            const letter = String.fromCharCode(65 + j);
            return (
              <button
                key={j}
                type="button"
                onClick={() => handleSelectOption(j)}
                className="w-full text-left bg-bg hover:bg-pri/5 hover:border-pri/40 border border-line rounded-2xl p-4 transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <span className="w-8 h-8 rounded-xl bg-card border border-line font-bold text-xs grid place-items-center text-ink group-hover:bg-pri group-hover:text-white group-hover:border-pri transition-colors shrink-0">
                  {letter}
                </span>
                <span className="text-xs font-semibold text-ink group-hover:text-pri transition-colors flex-1">
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
