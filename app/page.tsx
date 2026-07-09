"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { InspectorPanel, InspectorMode } from '../components/layout/InspectorPanel';
import { JobList, Job } from '../components/jobs/JobList';
import { CommandBar } from '../components/ui/CommandBar';

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState(false);

  const [selectedPortal, setSelectedPortal] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('New');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [searchText, setSearchText] = useState<string>('');

  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Inspector State Machine ──────────────────────────────────────────────
  // Three modes: hidden | brief | insights
  // Priority: brief (job selected) > insights (explicit) > hidden (default)
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('hidden');

  // Remember last explicit mode so we can restore it (per spec)
  const lastModeRef = useRef<'brief' | 'insights'>('insights');

  // Open brief whenever a job is selected (seamlessly updates if already open)
  const handleSelectJob = useCallback((job: Job) => {
    setActiveJob(job);
    setInspectorMode('brief');
    lastModeRef.current = 'brief';
  }, []);

  // Toggle insights: if already showing insights → hide; otherwise show insights
  const handleInsightsToggle = useCallback(() => {
    setInspectorMode(prev => {
      if (prev === 'insights') return 'hidden';
      // Switching to insights — deselect active job so we don't show stale brief
      setActiveJob(null);
      lastModeRef.current = 'insights';
      return 'insights';
    });
  }, []);

  // Close inspector and return to primary triage mode
  const handleCloseInspector = useCallback(() => {
    setInspectorMode('hidden');
    setActiveJob(null);
  }, []);

  // Escape key → always return to hidden
  // Arrow keys → navigate the feed
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
          e.preventDefault();
          handleSelectJob(filteredJobs[Math.min(currentIndex + 1, filteredJobs.length - 1)]);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) handleSelectJob(filteredJobs[currentIndex - 1]);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          if (activeJob) updateJobStatus(activeJob.id, 'Reviewed');
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          if (activeJob) updateJobStatus(activeJob.id, 'Archived');
          break;
        case 'o':
        case 'O':
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

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const portalMatch = selectedPortal === 'All' || job.sourcePortal === selectedPortal;
      const statusMatch = job.status === selectedStatus;
      const searchMatch = searchText === '' ||
        job.title.toLowerCase().includes(searchText.toLowerCase()) ||
        job.company.toLowerCase().includes(searchText.toLowerCase()) ||
        job.location.toLowerCase().includes(searchText.toLowerCase()) ||
        (job.snippet || '').toLowerCase().includes(searchText.toLowerCase());
      return portalMatch && statusMatch && searchMatch;
    });
  }, [jobs, selectedPortal, selectedStatus, searchText]);

  // ── Metrics ──────────────────────────────────────────────────────────────
  const newCount = jobs.filter(j => j.status === 'New').length;
  const reviewedCount = jobs.filter(j => j.status === 'Reviewed').length;
  const maxScore = jobs.length > 0 ? Math.max(...jobs.map(j => j.matchScore)) : 0;



  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 antialiased font-sans overflow-hidden">

      {/* Header */}
      <WorkspaceHeader
        selectedPortal={selectedPortal}
        setSelectedPortal={setSelectedPortal}
        isScraping={isScraping}
        startScrape={startScrape}
        stopScrape={stopScrape}
        fetchJobs={fetchJobs}
        loadingJobs={loadingJobs}
        totalCount={jobs.length}
        newCount={newCount}
        reviewedCount={reviewedCount}
        maxScore={maxScore}
        insightsModeActive={inspectorMode === 'insights'}
        onInsightsToggle={handleInsightsToggle}
      />

      {/* Main workspace: Feed + Inspector side by side */}
      <main className="flex flex-1 overflow-hidden">

        {/* Feed — expands to fill available width fluidly */}
        <section className="flex flex-col flex-1 min-w-0 overflow-hidden border-r border-slate-100">
          <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto overflow-hidden">
            {/* Search bar */}
            <div className="px-4 pt-4 pb-2 shrink-0">
              <CommandBar value={searchText} onChange={setSearchText} />
            </div>

            {/* Job list scrolls independently */}
            <div className="flex-1 overflow-y-auto">
              <JobList
                jobs={filteredJobs}
                activeJobId={activeJob ? activeJob.id : null}
                onSelectJob={handleSelectJob}
                onUpdateStatus={updateJobStatus}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
              />
            </div>
          </div>
        </section>

        {/* Inspector — slides in/out, never takes layout space when hidden */}
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
