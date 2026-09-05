"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FieldDescription, FieldLabel, FormField } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { weekdayLabel } from "@/lib/notifications/digest-period";
import {
  sendTestEmailToSelf,
  updatePersonalNotificationPreferences,
  updateWorkspaceNotificationPreferences,
} from "@/lib/notifications/actions";
import type {
  UserNotificationPreferences,
  WorkspaceNotificationPreferences,
} from "@/lib/notifications/preferences";

type Props = {
  workspace: WorkspaceNotificationPreferences;
  personal: UserNotificationPreferences;
  canEditWorkspace: boolean;
};

export function NotificationSettingsForm({
  workspace: initialWorkspace,
  personal: initialPersonal,
  canEditWorkspace,
}: Props) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [personal, setPersonal] = useState(initialPersonal);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function flash(ok: boolean, text: string) {
    if (ok) {
      setMessage(text);
      setError(null);
    } else {
      setError(text);
      setMessage(null);
    }
  }

  function saveWorkspace(patch: Partial<WorkspaceNotificationPreferences>) {
    const next = { ...workspace, ...patch };
    setWorkspace(next);
    startTransition(async () => {
      const result = await updateWorkspaceNotificationPreferences({
        instantEmailEnabled: next.instantEmailEnabled,
        weeklyDigestEmailEnabled: next.weeklyDigestEmailEnabled,
        monitorIssueEmailEnabled: next.monitorIssueEmailEnabled,
        competitorAlertsEnabled: next.competitorAlertsEnabled,
        missedOpportunityAlertsEnabled: next.missedOpportunityAlertsEnabled,
        recurringCitationAlertsEnabled: next.recurringCitationAlertsEnabled,
        productTipsEmailEnabled: next.productTipsEmailEnabled,
        sendEmptyDigest: next.sendEmptyDigest,
        digestWeekday: next.digestWeekday,
        digestHour: next.digestHour,
        digestTimezone: next.digestTimezone,
      });
      flash(result.ok, result.ok ? "Workspace alerts saved." : result.error);
    });
  }

  function savePersonal(
    patch: Partial<UserNotificationPreferences> & { unsubscribeAll?: boolean },
  ) {
    const next = { ...personal, ...patch };
    setPersonal(next);
    startTransition(async () => {
      const result = await updatePersonalNotificationPreferences({
        emailAlertsEnabled: next.emailAlertsEnabled,
        weeklyDigestEnabled: next.weeklyDigestEnabled,
        monitorIssueAlertsEnabled: next.monitorIssueAlertsEnabled,
        productTipsEnabled: next.productTipsEnabled,
        unsubscribeAll: patch.unsubscribeAll,
      });
      flash(result.ok, result.ok ? "Personal preferences saved." : result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {message ? (
        <Callout tone="citation" title="Saved">
          {message}
        </Callout>
      ) : null}
      {error ? (
        <Callout tone="danger" title="Could not save">
          {error}
        </Callout>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="type-title">Your email preferences</h2>
          <p className="mt-1 type-meta text-cited-ink-subtle">
            These settings only affect your account.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Switch
            label="Email alerts"
            checked={personal.emailAlertsEnabled && !personal.unsubscribedAllAt}
            disabled={pending}
            onCheckedChange={(checked) =>
              savePersonal({ emailAlertsEnabled: checked })
            }
          />
          <Switch
            label="Weekly digest"
            checked={
              personal.weeklyDigestEnabled &&
              !personal.digestUnsubscribedAt &&
              !personal.unsubscribedAllAt
            }
            disabled={pending}
            onCheckedChange={(checked) =>
              savePersonal({ weeklyDigestEnabled: checked })
            }
          />
          <Switch
            label="Monitor issue emails"
            checked={
              personal.monitorIssueAlertsEnabled && !personal.unsubscribedAllAt
            }
            disabled={pending}
            onCheckedChange={(checked) =>
              savePersonal({ monitorIssueAlertsEnabled: checked })
            }
          />
          <Switch
            label="Product tips and welcome series"
            checked={
              personal.productTipsEnabled &&
              !personal.productTipsUnsubscribedAt &&
              !personal.unsubscribedAllAt
            }
            disabled={pending}
            onCheckedChange={(checked) =>
              savePersonal({ productTipsEnabled: checked })
            }
          />
          <Button
            variant="subtle"
            size="sm"
            disabled={pending}
            onClick={() => savePersonal({ unsubscribeAll: true })}
          >
            Unsubscribe from all email notifications
          </Button>
          <p className="type-meta text-cited-ink-subtle">
            Unsubscribing does not change workspace monitoring.
          </p>
        </CardBody>
      </Card>

      {canEditWorkspace ? (
        <>
          <Card>
            <CardHeader>
              <h2 className="type-title">Workspace email alerts</h2>
              <p className="mt-1 type-meta text-cited-ink-subtle">
                Quiet, evidence-first notes when monitored AI surfaces cite your
                brand or configured competitors.
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <Switch
                label="Instant email alerts"
                checked={workspace.instantEmailEnabled}
                disabled={pending}
                onCheckedChange={(checked) =>
                  saveWorkspace({ instantEmailEnabled: checked })
                }
              />
              <Switch
                label="Weekly email digest"
                checked={workspace.weeklyDigestEmailEnabled}
                disabled={pending}
                onCheckedChange={(checked) =>
                  saveWorkspace({ weeklyDigestEmailEnabled: checked })
                }
              />
              <Switch
                label="Monitor issue email alerts"
                checked={workspace.monitorIssueEmailEnabled}
                disabled={pending}
                onCheckedChange={(checked) =>
                  saveWorkspace({ monitorIssueEmailEnabled: checked })
                }
              />
              <Switch
                label="Competitor citation alerts"
                checked={workspace.competitorAlertsEnabled}
                disabled={pending}
                onCheckedChange={(checked) =>
                  saveWorkspace({ competitorAlertsEnabled: checked })
                }
              />
              <Switch
                label="Missed opportunity alerts"
                checked={workspace.missedOpportunityAlertsEnabled}
                disabled={pending}
                onCheckedChange={(checked) =>
                  saveWorkspace({ missedOpportunityAlertsEnabled: checked })
                }
              />
              <Switch
                label="Recurring citation alerts"
                checked={workspace.recurringCitationAlertsEnabled}
                disabled={pending}
                onCheckedChange={(checked) =>
                  saveWorkspace({ recurringCitationAlertsEnabled: checked })
                }
              />
              <FieldDescription>
                Recurring alerts stay off by default so repeated observations do
                not spam the desk.
              </FieldDescription>
              <Switch
                label="Welcome series and product tips"
                checked={workspace.productTipsEmailEnabled}
                disabled={pending}
                onCheckedChange={(checked) =>
                  saveWorkspace({ productTipsEmailEnabled: checked })
                }
              />
              <FieldDescription>
                Includes the welcome nurture drip and the day-21 Learn Domains
                tip for paying workspaces.
              </FieldDescription>
              <Switch
                label="Send empty weekly digest"
                checked={workspace.sendEmptyDigest}
                disabled={pending}
                onCheckedChange={(checked) =>
                  saveWorkspace({ sendEmptyDigest: checked })
                }
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField>
                  <FieldLabel htmlFor="digest-weekday">Digest weekday</FieldLabel>
                  <Select
                    id="digest-weekday"
                    value={String(workspace.digestWeekday)}
                    disabled={pending}
                    onChange={(e) =>
                      saveWorkspace({
                        digestWeekday: Number(e.target.value),
                      })
                    }
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                      <option key={d} value={d}>
                        {weekdayLabel(d)}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="digest-hour">Digest hour</FieldLabel>
                  <Select
                    id="digest-hour"
                    value={String(workspace.digestHour)}
                    disabled={pending}
                    onChange={(e) =>
                      saveWorkspace({ digestHour: Number(e.target.value) })
                    }
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="digest-tz">Timezone</FieldLabel>
                  <TextInput
                    id="digest-tz"
                    defaultValue={workspace.digestTimezone}
                    disabled={pending}
                    onBlur={(e) => {
                      const value = e.target.value.trim() || "UTC";
                      if (value !== workspace.digestTimezone) {
                        saveWorkspace({ digestTimezone: value });
                      }
                    }}
                  />
                  <FieldDescription>
                    IANA timezone. Defaults to UTC when unset or invalid.
                  </FieldDescription>
                </FormField>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="type-title">Preview and test</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="type-body text-cited-ink-muted">
                Preview uses real recent workspace events when available. Test
                email goes only to your signed-in address.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  href="/app/settings/notifications/previews"
                >
                  Open previews
                </Button>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await sendTestEmailToSelf();
                      flash(
                        result.ok,
                        result.ok ? "Test email sent to you." : result.error,
                      );
                    });
                  }}
                >
                  Send test email to me
                </Button>
              </div>
            </CardBody>
          </Card>
        </>
      ) : (
        <Callout tone="info" title="Workspace alerts">
          Owners and admins manage workspace-wide email and digest settings. You
          can still control your personal email preferences above.
        </Callout>
      )}
    </div>
  );
}
