type LegalContactCardProps = {
  title: string;
  email: string;
  guidance?: string;
};

export function LegalContactCard({
  title,
  email,
  guidance,
}: LegalContactCardProps) {
  return (
    <div className="rounded-lg border border-cited-line-subtle bg-cited-surface/40 p-4 sm:p-5">
      <h2 className="type-title text-cited-ink">{title}</h2>
      {guidance ? (
        <p className="mt-2 type-body-sm text-cited-ink-muted">{guidance}</p>
      ) : null}
      <p className="mt-3">
        <a
          href={`mailto:${email}`}
          className="type-body text-cited-accent underline-offset-4 hover:underline"
        >
          {email}
        </a>
      </p>
    </div>
  );
}
