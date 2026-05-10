import { useEffect } from 'react';
import { Columns2, Rows2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { useMigrationStore } from '@/store/useMigrationStore';
import { PayloadTruthLabel } from "@/components/shared/PayloadTruthLabel";
import { InventoryList } from '@/components/layers/migration/InventoryList';
import { MetadataBar } from '@/components/layers/migration/MetadataBar';
import { SourcePane } from '@/components/layers/migration/SourcePane';
import { ExplanationPane } from '@/components/layers/migration/ExplanationPane';
import { DraftPane } from '@/components/layers/migration/DraftPane';
import { DiffView } from '@/components/layers/migration/DiffView';
import { BulkDraftModal } from '@/components/layers/migration/BulkDraftModal';

export function MigrationLayer() {
  const payload = useAssessmentStore((s) => s.payload);
  const { selectedId, select, viewMode, setViewMode } = useMigrationStore();

  // Auto-select the first artifact on mount if nothing is selected, so the
  // viewer never lands in an empty state on a fresh load.
  useEffect(() => {
    if (!selectedId && payload && payload.codeInventory.length > 0) {
      select(payload.codeInventory[0].id);
    }
  }, [selectedId, payload, select]);

  if (!payload) return null;

  const inventory = payload.codeInventory;
  const selected = inventory.find((a) => a.id === selectedId) ?? inventory[0];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Layer header — kept compact, this layer is the demo finale and uses
          almost the full viewport. */}
      <div className="flex items-center justify-between border-b border-border bg-card/60 px-6 py-3 backdrop-blur">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            AI Migration Drafts
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            CPQ source ↔ AI explanation ↔ generated RCA draft. {inventory.length} artifacts surfaced
            for review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('three_pane')}
              className={cn(
                'inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors focus-ring',
                viewMode === 'three_pane'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={viewMode === 'three_pane'}
            >
              <Columns2 className="h-3 w-3" />
              Three-pane
            </button>
            <button
              type="button"
              onClick={() => setViewMode('diff')}
              className={cn(
                'inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors focus-ring',
                viewMode === 'diff'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={viewMode === 'diff'}
            >
              <Rows2 className="h-3 w-3" />
              Side-by-side diff
            </button>
          </div>
          <PayloadTruthLabel />
        </div>
      </div>

      {/* Body — left rail + viewer */}
      <div className="flex flex-1 overflow-hidden">
        <InventoryList artifacts={inventory} />

        <div className="flex flex-1 flex-col overflow-hidden">
          {selected && <MetadataBar artifact={selected} />}

          {selected && viewMode === 'three_pane' && (
            <div className="grid flex-1 grid-cols-3 divide-x divide-border overflow-hidden">
              <SourcePane artifact={selected} />
              <ExplanationPane artifact={selected} />
              <DraftPane artifact={selected} />
            </div>
          )}

          {selected && viewMode === 'diff' && (
            <div className="flex-1 overflow-hidden">
              <DiffView artifact={selected} />
            </div>
          )}
        </div>
      </div>

      <BulkDraftModal artifacts={inventory} />
    </div>
  );
}
