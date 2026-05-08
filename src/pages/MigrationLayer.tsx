import { LayerScaffold } from './LayerScaffold';

export function MigrationLayer() {
  return (
    <LayerScaffold
      title="AI migration drafts"
      subtitle="CPQ source ↔ AI explanation ↔ generated RCA draft."
      truthLabel="ai_generated"
      milestone="M6 will populate the code inventory rail, three-pane viewer, draft generation flow, side-by-side diff, and bulk-draft action."
    />
  );
}
