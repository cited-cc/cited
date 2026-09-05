import { LocalSignInForm } from "@/components/auth/local-sign-in-form";

type SignInFormSwitcherProps = {
  redirectUrl: string;
  showSetupLink?: boolean;
};

export function SignInFormSwitcher({
  redirectUrl,
  showSetupLink,
}: SignInFormSwitcherProps) {
  return (
    <LocalSignInForm redirectUrl={redirectUrl} showSetupLink={showSetupLink} />
  );
}
