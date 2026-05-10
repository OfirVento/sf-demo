import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { TopBar } from '@/components/shell/TopBar';
import { AgentPanel } from '@/components/shared/AgentPanel';
import { EvidenceDrawer } from '@/components/shared/EvidenceDrawer';
import { KbDrawer } from '@/components/shared/KbDrawer';
import { GuidedWorkflow } from '@/components/shared/GuidedWorkflow';
import { TruthLabelLegend } from '@/components/shared/TruthLabelLegend';
import { loadAssessmentPayload } from '@/lib/assessment/loader';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { applyTheme, useThemeStore } from '@/store/useThemeStore';

import { Landing } from '@/pages/Landing';
import { ExecutiveLayer } from '@/pages/ExecutiveLayer';
import { SalesLayer } from '@/pages/SalesLayer';
import { SalesforceLayer } from '@/pages/SalesforceLayer';
import { SalesforceBriefing } from '@/pages/SalesforceBriefing';
import { MigrationLayer } from '@/pages/MigrationLayer';
import { ImplementationLayer } from '@/pages/ImplementationLayer';
import { PayloadError } from '@/pages/PayloadError';

const LAYER_FROM_PATH: Record<string, string> = {
  executive: 'executive',
  sales: 'sales',
  salesforce: 'salesforce',
  migration: 'migration',
  implementation: 'implementation',
};

function currentLayer(pathname: string): string {
  const segs = pathname.split('/').filter(Boolean);
  if (segs[0] === 'assessment' && segs[1]) return LAYER_FROM_PATH[segs[1]] ?? 'default';
  return 'default';
}

function AppShell() {
  const location = useLocation();
  const layer = currentLayer(location.pathname);
  const userTheme = useThemeStore((s) => s.theme);

  // Layer 4 (Migration) forces dark by default, regardless of global toggle.
  useEffect(() => {
    if (layer === 'migration') {
      applyTheme('dark');
    } else {
      applyTheme(userTheme);
    }
  }, [layer, userTheme]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <main key={location.pathname} className="route-fade flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <AgentPanel layer={layer} />
      </div>
      <EvidenceDrawer />
      <KbDrawer />
      <GuidedWorkflow />
      <TruthLabelLegend />
    </div>
  );
}

export function App() {
  const setPayload = useAssessmentStore((s) => s.setPayload);
  const userTheme = useThemeStore((s) => s.theme);
  const result = loadAssessmentPayload();

  useEffect(() => {
    applyTheme(userTheme);
  }, [userTheme]);

  useEffect(() => {
    if (result.ok) setPayload(result.payload);
  }, [result, setPayload]);

  if (!result.ok) {
    return <PayloadError errors={result.errors} />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/assessment/executive" element={<ExecutiveLayer />} />
        <Route path="/assessment/sales" element={<SalesLayer />} />
        <Route path="/assessment/salesforce" element={<SalesforceLayer />} />
        <Route path="/assessment/salesforce/briefing" element={<SalesforceBriefing />} />
        <Route path="/assessment/migration" element={<MigrationLayer />} />
        <Route path="/assessment/implementation" element={<ImplementationLayer />} />
        <Route path="*" element={<Landing />} />
      </Route>
    </Routes>
  );
}
