import { Link } from 'react-router-dom';
import { TruthLabel } from '@/components/shared/TruthLabel';
import { useAssessmentStore } from '@/store/useAssessmentStore';

export function Landing() {
  const payload = useAssessmentStore((s) => s.payload);
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col justify-center px-6 py-16">
      <div className="space-y-6">
        <TruthLabel variant="sample_data" />
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Connect a Salesforce CPQ org.
        </h1>
        <p className="text-lg text-muted-foreground">
          Vento generates an evidence-backed CPQ → Revenue Cloud Advanced assessment in five
          audience-specific surfaces.
        </p>
        {payload && (
          <p className="text-sm text-muted-foreground">
            Loaded sample assessment for <span className="font-medium text-foreground">{payload.meta.orgName}</span>.
          </p>
        )}
        <div className="flex gap-3">
          <Link
            to="/assessment/executive"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 focus-ring"
          >
            Open assessment
          </Link>
          <button
            type="button"
            disabled
            className="rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground"
          >
            Connect org (stub)
          </button>
        </div>
      </div>
    </div>
  );
}
