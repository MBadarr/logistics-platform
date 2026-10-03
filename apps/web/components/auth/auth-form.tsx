"use client";

import Link from "next/link";
import { Button, buttonStyles } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import { PasswordInput } from "@repo/ui/password-input";
import { Alert } from "@repo/ui/alert";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "../../lib/auth/client";

type Mode = "login" | "signup" | "forgot-password" | "reset-password";
const content = {
  login: {
    title: "Welcome back.",
    subtitle: "Sign in to keep your operations moving.",
    action: "Sign in",
    eyebrow: "YOUR WORKSPACE AWAITS",
  },
  signup: {
    title: "Make your next move.",
    subtitle: "Create your account and bring your operations together.",
    action: "Create account",
    eyebrow: "LET’S GET STARTED",
  },
  "forgot-password": {
    title: "Let’s get you back in.",
    subtitle:
      "Enter your account email. We’ll send a link to reset your password.",
    action: "Send reset link",
    eyebrow: "PASSWORD RECOVERY",
  },
  "reset-password": {
    title: "A fresh start.",
    subtitle: "Choose a new password to secure your account.",
    action: "Update password",
    eyebrow: "RESET YOUR PASSWORD",
  },
};

export function AuthForm({ mode, token }: { mode: Mode; token?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const copy = content[mode];
  const invalidToken =
    mode === "reset-password" && (!token || token.length > 2048);

  async function signInWithGoogle() {
    if (busy || googleBusy) return;
    setError("");
    setGoogleBusy(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Unable to sign in with Google. Try again.");
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to sign in with Google. Try again.");
    } finally {
      setGoogleBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || googleBusy) return;
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    if (
      mode === "reset-password" &&
      form.get("password") !== form.get("confirmPassword")
    ) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      const password = String(form.get("password") ?? "");
      const result = mode === "signup"
        ? await authClient.signUp.email({ name: String(form.get("name") ?? "").trim(), email, password })
        : mode === "login"
          ? await authClient.signIn.email({ email, password })
          : mode === "forgot-password"
            ? await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` })
            : await authClient.resetPassword({ token: token!, newPassword: password });
      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        throw new Error(result.error.message ?? "Please check your details and try again.");
      }
      if (mode === "login" || mode === "signup") {
        const session = await authClient.getSession();
        if (!session.data?.user) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      } else setMessage(mode === "forgot-password"
        ? "If an account exists for that email, a password reset link will be sent."
        : "Password updated. Sign in with your new password.");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="my-auto w-full max-w-100 py-14 auth:py-9 [&>h1]:text-3xl auth:[&>h1]:text-4xl [&>h1]:leading-tight [&>h1]:font-medium [&>h1]:tracking-tight">
      <p className="mb-4 text-xs font-bold tracking-widest text-eyebrow">
        {copy.eyebrow}
      </p>
      <h1>{copy.title}</h1>
      <p className="mt-4 mb-8 text-sm leading-relaxed text-muted">
        {copy.subtitle}
      </p>
      {message ? (
        <div className="flex flex-col gap-6 text-sm leading-relaxed">
          <span
            className="grid size-12 place-items-center rounded-full bg-success text-2xl text-link"
            aria-hidden="true"
          >
            ✓
          </span>
          <p role="status">{message}</p>
          <Link className={buttonStyles({ fullWidth: true })} href="/login">
            Back to sign in →
          </Link>
        </div>
      ) : invalidToken ? (
        <div className="flex flex-col gap-6 text-sm leading-relaxed">
          <p role="alert">
            This reset link is missing or invalid. Request a new link to
            continue.
          </p>
          <Link
            className={buttonStyles({ fullWidth: true })}
            href="/forgot-password"
          >
            Request a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          {(mode === "login" || mode === "signup") && (
            <>
              <Button
                type="button"
                variant="outline"
                fullWidth
                className="py-3.5 text-sm font-semibold"
                loading={googleBusy}
                disabled={busy}
                onClick={signInWithGoogle}
              >
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z" />
                  <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.4l-3.24-2.52c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22Z" />
                  <path fill="#FBBC05" d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.66.11-1.3.31-1.92v-2.6H3.07A10 10 0 0 0 2 12c0 1.61.38 3.14 1.07 4.52l3.34-2.6Z" />
                  <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.6C7.2 7.72 9.4 5.96 12 5.96Z" />
                </svg>
                {googleBusy ? "Connecting to Google…" : "Continue with Google"}
              </Button>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="h-px flex-1 bg-divider" />
                <span>or continue with email</span>
                <span className="h-px flex-1 bg-divider" />
              </div>
            </>
          )}
          {mode === "signup" && (
            <Field>
              Full name
              <Input
                name="name"
                autoComplete="name"
                placeholder="Alex Morgan"
                minLength={2}
                maxLength={100}
                required
              />
            </Field>
          )}
          {mode !== "reset-password" && (
            <Field>
              Email address
              <Input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                maxLength={254}
                required
              />
            </Field>
          )}
          {mode !== "forgot-password" && (
            <Field>
              <span className="flex justify-between gap-3 [&>a]:font-normal [&>a]:text-link-muted">
                Password{" "}
                {mode === "login" && (
                  <Link href="/forgot-password">Forgot password?</Link>
                )}
              </span>
              <PasswordInput
                name="password"

                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder={
                  mode === "login"
                    ? "Enter your password"
                    : "At least 12 characters"
                }
                minLength={mode === "login" ? 1 : 12}
                maxLength={128}
                required
              />
            </Field>
          )}
          {mode === "reset-password" && (
            <Field>
              Confirm password
              <PasswordInput
                name="confirmPassword"

                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </Field>
          )}
          {error && <Alert>{error}</Alert>}
          <Button fullWidth type="submit" loading={busy} disabled={googleBusy}>
            {busy ? "Please wait…" : copy.action}
            <span aria-hidden="true">→</span>
          </Button>
          {mode === "signup" && (
            <p className="text-xs leading-relaxed text-muted">
              Use a unique password with at least 12 characters.
            </p>
          )}
        </form>
      )}
      <p className="mt-7 text-center text-sm text-muted [&_a]:font-semibold [&_a]:text-link">
        {mode === "login" ? (
          <>
            New here? <Link href="/signup">Create an account</Link>
          </>
        ) : mode === "signup" ? (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        ) : (
          <Link href="/login">← Back to sign in</Link>
        )}
      </p>
    </section>
  );
}
