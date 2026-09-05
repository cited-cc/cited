import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import {
  DEMO_EMAIL_ALERT,
  DEMO_WEEKLY_DIGEST,
} from "@/lib/demo/demo-notes";

export function DemoAlertPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="demo-alert-preview">
      <Card className="bg-cited-surface">
        <CardBody>
          <div className="flex items-center justify-between gap-2">
            <p className="type-micro">Email alert</p>
            <Badge variant="warning">Demo</Badge>
          </div>
          <p className="mt-3 type-meta text-cited-ink-subtle">
            {DEMO_EMAIL_ALERT.subject}
          </p>
          <h3 className="mt-2 type-title text-[1rem]">
            {DEMO_EMAIL_ALERT.headline}
          </h3>
          <p className="mt-2 type-body-sm text-cited-ink-muted">
            {DEMO_EMAIL_ALERT.body}
          </p>
          <p className="mt-4 type-meta text-cited-ink-faint">
            {DEMO_EMAIL_ALERT.footer}
          </p>
        </CardBody>
      </Card>
      <Card className="bg-cited-surface">
        <CardBody>
          <div className="flex items-center justify-between gap-2">
            <p className="type-micro">Weekly digest</p>
            <Badge variant="warning">Demo</Badge>
          </div>
          <h3 className="mt-3 type-title text-[1rem]">
            {DEMO_WEEKLY_DIGEST.subject}
          </h3>
          <p className="mt-2 type-body-sm text-cited-ink-muted">
            {DEMO_WEEKLY_DIGEST.summary}
          </p>
          <ul className="mt-4 space-y-2">
            {DEMO_WEEKLY_DIGEST.highlights.map((item) => (
              <li key={item} className="type-body-sm text-cited-ink-subtle">
                · {item}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
