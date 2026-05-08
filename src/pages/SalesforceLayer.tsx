import { Link } from 'react-router-dom';
import { LayerScaffold } from './LayerScaffold';

export function SalesforceLayer() {
  return (
    <LayerScaffold
      title="Revenue Cloud / Agentforce Revenue Management Readiness"
      subtitle="Discovery completed in minutes. SI-ready in weeks."
      truthLabel="sample_data"
      milestone="M5 will populate the readiness verdict, expansion-signals grid, risk heatmap, co-sell narrative, and one-page briefing export."
    >
      <Link
        to="/assessment/salesforce/briefing"
        className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground focus-ring"
      >
        Preview briefing route →
      </Link>
    </LayerScaffold>
  );
}
