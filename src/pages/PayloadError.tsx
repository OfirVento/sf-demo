import type { ErrorObject } from 'ajv';

export function PayloadError({ errors }: { errors: ErrorObject[] }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-lg border border-severity-critical/40 bg-severity-critical/5 p-6">
        <h1 className="text-xl font-semibold text-severity-critical">Assessment payload failed validation</h1>
        <p className="mt-2 text-sm text-foreground/80">
          <code className="font-mono">inputs/assessment-payload.json</code> does not conform to the schema. The
          app will not render to avoid showing wrong data in front of an audience.
        </p>
        <ul className="mt-4 space-y-2 font-mono text-xs">
          {errors.map((e, i) => (
            <li key={i} className="rounded bg-card px-3 py-2 text-foreground/90">
              <span className="text-muted-foreground">{e.instancePath || '/'}</span>{' '}
              <span>{e.message}</span>
              {e.params && Object.keys(e.params).length > 0 && (
                <span className="text-muted-foreground"> · {JSON.stringify(e.params)}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
