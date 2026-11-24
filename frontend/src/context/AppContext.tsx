'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AppContextType {
  college: 'A' | 'B';
  setCollege: (c: 'A' | 'B') => void;
  apiConnected: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  // Local reactive state for fast UI feedback & offline preservation
  skills: Record<string, number>; // 0: Claimed, 1: Observed, 2: Evidence-linked, 3: Assessed, 4: Verified
  setSkills: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  evidenceDescriptions: Record<string, string>;
  setEvidenceDescriptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  timeline: Array<{ s: string; k: string; t: string; at: string }>;
  addTimelineItem: (s: string, k: string, t: string) => void;
  tasks: number[];
  setTasks: React.Dispatch<React.SetStateAction<number[]>>;
  calendarClash: boolean;
  setCalendarClash: (clash: boolean) => void;
  privacy: { lc: boolean; rec: boolean };
  setPrivacy: React.Dispatch<React.SetStateAction<{ lc: boolean; rec: boolean }>>;
  githubConnected: boolean;
  setGithubConnected: (val: boolean) => void;
  appealed: boolean;
  setAppealed: (val: boolean) => void;
  mockTestPassed: boolean;
  setMockTestPassed: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [college, setCollege] = useState<'A' | 'B'>('A');
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [skills, setSkills] = useState<Record<string, number>>({
    Python: 0,
    SQL: 0,
    Git: 0,
    Docker: 0,
  });

  const [evidenceDescriptions, setEvidenceDescriptions] = useState<Record<string, string>>({});
  const [timeline, setTimeline] = useState<Array<{ s: string; k: string; t: string; at: string }>>([]);
  const [tasks, setTasks] = useState<number[]>([0, 0, 0]);
  const [calendarClash, setCalendarClash] = useState<boolean>(true);
  const [privacy, setPrivacy] = useState<{ lc: boolean; rec: boolean }>({ lc: false, rec: true });
  const [githubConnected, setGithubConnected] = useState<boolean>(false);
  const [appealed, setAppealed] = useState<boolean>(false);
  const [mockTestPassed, setMockTestPassed] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const addTimelineItem = (s: string, k: string, t: string) => {
    const at = new Date().toLocaleTimeString();
    setTimeline((prev) => [{ s, k, t, at }, ...prev]);
  };

  // Check health and sync initial profile on load
  useEffect(() => {
    async function check() {
      const isHealthy = await api.checkHealth();
      setApiConnected(isHealthy);
      if (isHealthy) {
        const prof = await api.getStudentProfile('student-rahul-01');
        if (prof?.competencies) {
          const skMap: Record<string, number> = { Python: 0, SQL: 0, Git: 0, Docker: 0 };
          const stateOrder = ['claimed', 'observed', 'evidence_linked', 'assessed', 'verified', 'expired'];
          prof.competencies.forEach((c) => {
            const idx = stateOrder.indexOf(c.state.toLowerCase());
            if (idx >= 0) skMap[c.skill_name] = idx;
          });
          setSkills(skMap);
          setGithubConnected(prof.student.github_connected);
        }
      }
    }
    check();
  }, [college]);

  return (
    <AppContext.Provider
      value={{
        college,
        setCollege,
        apiConnected,
        toastMessage,
        showToast,
        skills,
        setSkills,
        evidenceDescriptions,
        setEvidenceDescriptions,
        timeline,
        addTimelineItem,
        tasks,
        setTasks,
        calendarClash,
        setCalendarClash,
        privacy,
        setPrivacy,
        githubConnected,
        setGithubConnected,
        appealed,
        setAppealed,
        mockTestPassed,
        setMockTestPassed,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-ink text-bg px-4 py-3 font-semibold shadow-xl transition-all duration-200">
          {toastMessage}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
