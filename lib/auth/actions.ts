"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { canRunBrowserBootstrap, runSelfHostedBootstrap } from "@/lib/auth/bootstrap";
import { isLocalAuthEnabled } from "@/lib/auth/config";
import { requireAuthenticatedPrincipal } from "@/lib/auth/guards";
import {
  acceptWorkspaceInvitation,
  createWorkspaceInvitation,
} from "@/lib/auth/invitations";
import { changeLocalPassword } from "@/lib/auth/local-credentials";
import { AuthError } from "@/lib/auth/errors";
import { requireWorkspaceRole } from "@/lib/auth/index";
import { sanitizeReturnPath } from "@/lib/auth/redirects";
import type { WorkspaceRole } from "@/types/product";

export type ActionResult =
  | { ok: true; message?: string; invitationUrl?: string }
  | { ok: false; error: string };

export async function bootstrapSelfHostedAction(formData: FormData): Promise<ActionResult> {
  try {
    const eligible = await canRunBrowserBootstrap();
    if (!eligible) {
      return { ok: false, error: "Setup is not available." };
    }

    const bootstrapToken = String(formData.get("bootstrapToken") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("displayName") ?? "") || null;
    const workspaceName = String(formData.get("workspaceName") ?? "") || null;

    await runSelfHostedBootstrap({
      bootstrapToken,
      email,
      password,
      displayName,
      workspaceName,
    });

    const signInResult = await signIn("local-credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      redirect("/sign-in?notice=bootstrap_complete");
    }

    redirect("/app");
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Setup could not be completed.",
    };
  }
}

export async function localSignInAction(formData: FormData): Promise<ActionResult> {
  if (!isLocalAuthEnabled()) {
    return { ok: false, error: "Local sign-in is not enabled." };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectUrl = sanitizeReturnPath(
    String(formData.get("redirectUrl") ?? ""),
    "/app",
  );

  const result = await signIn("local-credentials", {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    return { ok: false, error: "Incorrect email or password." };
  }

  redirect(redirectUrl);
}

export async function localSignOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export async function changeLocalPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const principal = await requireAuthenticatedPrincipal();
    if (!isLocalAuthEnabled() || principal.provider !== "local") {
      return { ok: false, error: "Password change is not available." };
    }

    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");

    await changeLocalPassword({
      userId: principal.userId,
      currentPassword,
      newPassword,
    });

    await signOut({ redirect: false });
    revalidatePath("/app/settings/security");
    return { ok: true, message: "Password updated. Sign in again." };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Password could not be updated.",
    };
  }
}

export async function createInvitationAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const workspaceId = String(formData.get("workspaceId") ?? "");
    const email = String(formData.get("email") ?? "");
    const role = String(formData.get("role") ?? "member") as WorkspaceRole;
    const principal = await requireAuthenticatedPrincipal();

    await requireWorkspaceRole(workspaceId, ["owner", "admin"]);

    const invitation = await createWorkspaceInvitation({
      workspaceId,
      email,
      role,
      invitedByUserId: principal.userId,
    });

    const invitationUrl = `/accept-invite?token=${encodeURIComponent(invitation.token)}`;
    return {
      ok: true,
      message: "Invitation created.",
      invitationUrl,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Invitation could not be created.",
    };
  }
}

export async function acceptInvitationAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const token = String(formData.get("token") ?? "");
    const principal = await requireAuthenticatedPrincipal();

    await acceptWorkspaceInvitation({ token, principal });
    redirect("/app");
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Invitation could not be accepted.",
    };
  }
}
