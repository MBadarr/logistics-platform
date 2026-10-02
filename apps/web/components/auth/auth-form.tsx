"use client";

import Link from "next/link";
import { Button, buttonStyles } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import { PasswordInput } from "@repo/ui/password-input";
import { Alert } from "@repo/ui/alert";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const copy = content[mode];
  const invalidToken =
    mode === "reset-password" && !/^[a-f0-9]{64}$/.test(token ?? "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          token,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "Please check your details and try again.",
        );
      if (mode === "login" || mode === "signup") {
        router.replace("/dashboard");
        router.refresh();
      } else setMessage(data.message);
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
          <Button fullWidth type="submit" loading={busy}>
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
