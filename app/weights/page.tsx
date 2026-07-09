// app/weights/page.tsx
'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { WeightsConfigurator } from '@/components/weights/WeightsConfigurator';

export default function WeightsPage() {
  // Sidebar requires these props — provide no-ops since scraping/portal controls
  // are not relevant on this page (the nav links still work via usePathname)
  const [selectedPortal, setSelectedPortal] = useState('All');
  const [isScraping] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar
        selectedPortal={selectedPortal}
        setSelectedPortal={setSelectedPortal}
        isScraping={isScraping}
        startScrape={() => {}}
        stopScrape={() => {}}
        fetchJobs={() => {}}
        loadingJobs={false}
        totalCount={0}
      />
      <main className="flex-1 overflow-y-auto">
        <WeightsConfigurator />
      </main>
    </div>
  );
}

