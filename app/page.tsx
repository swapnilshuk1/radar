"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { InspectorPanel, InspectorMode } from '../components/layout/InspectorPanel';
import { JobList, Job } from '../components/jobs/JobList';

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState(false);

  const [selectedTab, setSelectedTab] = useState<string>('OVERVIEW');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [searchText, setSearchText] = useState<string>('');

  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Inspector State Machine ──────────────────────────────────────────────
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('hidden');
  const lastModeRef = useRef<'brief' | 'insights'>('insights');

  // Open brief whenever a job is selected
  const handleSelectJob = useCallback((job: Job) => {
    setActiveJob(job);
    setInspectorMode('brief');
    lastModeRef.current = 'brief';
  }, []);

  // Toggle insights
  const handleInsightsToggle = useCallback(() => {
    setInspectorMode(prev => {
      if (prev === 'insights') return 'hidden';
      setActiveJob(null);
      lastModeRef.current = 'insights';
      return 'insights';
    });
  }, []);

  // Close inspector
  const handleCloseInspector = useCallback(() => {
    setInspectorMode('hidden');
    setActiveJob(null);
  }, []);

  // Escape key ➔ close briefing, J/K ➔ navigate, Enter ➔ open URL, S ➔ watchlist, A ➔ archive
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const inInput = document.activeElement?.tagName === 'INPUT' ||
                      document.activeElement?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (inspectorMode !== 'hidden') handleCloseInspector();
        return;
      }

      if (inInput || filteredJobs.length === 0) return;

      const currentIndex = activeJob
        ? filteredJobs.findIndex(j => j.id === activeJob.id)
        : -1;

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
        case 'J':
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, filteredJobs.length - 1);
          if (nextIndex >= 0) handleSelectJob(filteredJobs[nextIndex]);
          break;
        case 'ArrowUp':
        case 'k':
        case 'K':
          e.preventDefault();
          const prevIndex = currentIndex - 1;
          if (prevIndex >= 0) handleSelectJob(filteredJobs[prevIndex]);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          if (activeJob) {
            const nextStatus = activeJob.status === 'Reviewed' ? 'New' : 'Reviewed';
            updateJobStatus(activeJob.id, nextStatus);
          }
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          if (activeJob) {
            const nextStatus = activeJob.status === 'Archived' ? 'New' : 'Archived';
            updateJobStatus(activeJob.id, nextStatus);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (activeJob) {
            let url = activeJob.url;
            if (url && !url.startsWith('http')) {
              if (activeJob.sourcePortal === 'LinkedIn')  url = `https://www.linkedin.com${url}`;
              else if (activeJob.sourcePortal === 'Indeed') url = `https://in.indeed.com${url}`;
              else if (activeJob.sourcePortal === 'Naukri') url = `https://www.naukri.com${url}`;
            }
            window.open(url, '_blank', 'noreferrer');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectorMode, activeJob, handleSelectJob, handleCloseInspector]);

  // ── Data Fetching ────────────────────────────────────────────────────────
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        if (activeJob) {
          const updated = data.find((j: Job) => j.id === activeJob.id);
          if (updated) setActiveJob(updated);
        }
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const startScrape = () => {
    if (isScraping) return;
    setIsScraping(true);
    setLogs(['[SYSTEM] Initializing scraping engine...']);
    setActiveJob(null);

    const eventSource = new EventSource('/api/scrape');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          setLogs(prev => [...prev, data.message]);
          if (data.message.includes('Saved/Upserted') || data.message.includes('completed successfully')) {
            fetchJobs();
          }
        }
      } catch {
        setLogs(prev => [...prev, `[PARSE ERROR] ${event.data}`]);
      }
    };

    eventSource.onerror = () => {
      setLogs(prev => [...prev, '[SYSTEM] Scraper connection closed.']);
      eventSource.close();
      setIsScraping(false);
      fetchJobs();
    };
  };

  const stopScrape = async () => {
    if (!isScraping) return;
    setLogs(prev => [...prev, '[SYSTEM] Sending cancellation signal to scraper...']);
    try { await fetch('/api/scrape/stop', { method: 'POST' }); } catch { /* ignore */ }
    eventSourceRef.current?.close();
    setIsScraping(false);
    setLogs(prev => [...prev, '[SYSTEM] Scraper terminated.']);
    fetchJobs();
  };

  const updateJobStatus = async (id: string, status: 'New' | 'Reviewed' | 'Archived') => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
        if (activeJob?.id === id) setActiveJob(prev => prev ? { ...prev, status } : null);
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  // ── Tab-based Filtering ➔ OVERVIEW | OPPORTUNITIES | WATCHLIST | ARCHIVED ─
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      let statusMatch = false;
      if (selectedTab === 'OVERVIEW') statusMatch = job.status === 'New';
      else if (selectedTab === 'OPPORTUNITIES') statusMatch = job.status === 'New' || job.status === 'Reviewed';
      else if (selectedTab === 'WATCHLIST') statusMatch = job.status === 'Reviewed';
      else if (selectedTab === 'ARCHIVED') statusMatch = job.status === 'Archived';

      const searchMatch = searchText === '' ||
        job.title.toLowerCase().includes(searchText.toLowerCase()) ||
        job.company.toLowerCase().includes(searchText.toLowerCase()) ||
        job.location.toLowerCase().includes(searchText.toLowerCase()) ||
        (job.snippet || '').toLowerCase().includes(searchText.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [jobs, selectedTab, searchText]);

  // ── Stats Counts for Snapshot cards ──────────────────────────────────────
  const stats = useMemo(() => {
    const newJobs = jobs.filter(j => j.status === 'New');
    const applyCount = newJobs.filter(j => j.matchScore >= 65).length;
    const tailorCount = newJobs.filter(j => j.matchScore >= 50 && j.matchScore < 65).length;
    const watchCount = newJobs.filter(j => j.matchScore >= 35 && j.matchScore < 50).length;
    const unlockCount = newJobs.filter(j => j.matchScore >= 50).length; // actionable tips count

    return {
      apply: applyCount,
      tailor: tailorCount,
      watch: watchCount,
      unlock: unlockCount
    };
  }, [jobs]);

  return (
    <div className="flex flex-col h-screen bg-[hsl(var(--background))] text-slate-900 antialiased font-sans overflow-hidden">
      
      {/* Redesigned WorkspaceHeader */}
      <WorkspaceHeader
        searchText={searchText}
        setSearchText={setSearchText}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isScraping={isScraping}
        startScrape={startScrape}
        stopScrape={stopScrape}
        fetchJobs={fetchJobs}
        loadingJobs={loadingJobs}
      />

      {/* Main Workspace split layout */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* Left Side: Job Feed */}
        <section className={`flex flex-col border-r border-[#E2E8F0] overflow-hidden bg-[hsl(var(--background))] transition-all duration-200 ${inspectorMode !== 'hidden' ? 'w-[440px] shrink-0' : 'flex-1'}`}>
          <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto overflow-hidden px-6 pt-6">
            <div className="flex-1 overflow-y-auto pr-2 pb-6">
              <JobList
                jobs={filteredJobs}
                activeJobId={activeJob ? activeJob.id : null}
                onSelectJob={handleSelectJob}
                onUpdateStatus={updateJobStatus}
                selectedTab={selectedTab}
                stats={stats}
              />
            </div>
          </div>
        </section>

        {/* Right Side: Split-Pane Briefing / Insights */}
        <InspectorPanel
          mode={inspectorMode}
          activeJob={activeJob}
          jobs={jobs}
          logs={logs}
          onClose={handleCloseInspector}
          onUpdateStatus={updateJobStatus}
        />

      </main>
    </div>
  );
}
