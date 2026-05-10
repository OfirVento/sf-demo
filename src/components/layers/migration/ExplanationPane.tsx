import type { CodeArtifact } from '@/types/assessment';

export function ExplanationPane({ artifact }: { artifact: CodeArtifact }) {
  return (
    <section className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-muted-foreground">
          What this code does
        </span>
        <span className="text-[10px] text-muted-foreground">AI-generated</span>
      </header>
      <div className="flex-1 space-y-5 overflow-auto px-5 py-5 text-[15px] leading-relaxed">
        <p className="text-foreground/95">{artifact.businessPurpose}</p>

        {artifact.draft.plainLanguageExplanation && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              How it migrates
            </div>
            <p className="text-foreground/85">{artifact.draft.plainLanguageExplanation}</p>
          </div>
        )}

        {artifact.dependencies.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dependencies
            </div>
            <ul className="space-y-1.5 text-sm">
              {artifact.dependencies.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {d.type}
                  </span>
                  <div>
                    <span className="font-medium text-foreground">{d.name}</span>
                    <span className="ml-1 font-mono text-xs text-muted-foreground">
                      {d.reference}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
