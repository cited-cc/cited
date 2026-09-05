"use client";

import { useTransition } from "react";

import { Button, ButtonRow } from "@/components/ui/button";
import {
  pauseMonitorAction,
  resumeMonitorAction,
} from "@/lib/monitoring/monitor-actions";

export function MonitorControls(props: {
  workspaceId: string;
  monitorConfigurationId: string;
  activationStatus: string;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!props.canManage) {
    return null;
  }

  const isPaused =
    props.activationStatus === "paused" ||
    props.activationStatus === "blocked";
  const isActive = props.activationStatus === "active";

  return (
    <ButtonRow className="gap-2 sm:gap-2">
      {isActive ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await pauseMonitorAction({
                workspaceId: props.workspaceId,
                monitorConfigurationId: props.monitorConfigurationId,
              });
            });
          }}
        >
          Pause
        </Button>
      ) : null}
      {isPaused ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending || props.activationStatus === "blocked"}
          onClick={() => {
            startTransition(async () => {
              await resumeMonitorAction({
                workspaceId: props.workspaceId,
                monitorConfigurationId: props.monitorConfigurationId,
              });
            });
          }}
        >
          Resume
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" href="/onboarding?step=4">
        Edit setup
      </Button>
    </ButtonRow>
  );
}
