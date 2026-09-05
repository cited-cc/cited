type LegalEffectiveDateProps = {
  effectiveDate: string;
  lastUpdated: string;
};

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function LegalEffectiveDate({
  effectiveDate,
  lastUpdated,
}: LegalEffectiveDateProps) {
  return (
    <p className="mt-3 type-meta text-cited-ink-subtle">
      Effective {formatDate(effectiveDate)}
      {lastUpdated !== effectiveDate
        ? ` · Last updated ${formatDate(lastUpdated)}`
        : null}
    </p>
  );
}
