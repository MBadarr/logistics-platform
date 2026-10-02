"use client";

import Link from "next/link";
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
  const [showPassword, setShowPassword] = useState(false);
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
    <section className="auth-card">
      <p className="auth-eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="auth-description">{copy.subtitle}</p>
      {message ? (
        <div className="auth-complete">
          <span className="auth-complete-icon" aria-hidden="true">
            ✓
          </span>
          <p role="status">{message}</p>
          <Link className="auth-submit" href="/login">
            Back to sign in →
          </Link>
        </div>
      ) : invalidToken ? (
        <div className="auth-complete">
          <p role="alert">
            This reset link is missing or invalid. Request a new link to
            continue.
          </p>
          <Link className="auth-submit" href="/forgot-password">
            Request a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && (
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                placeholder="Alex Morgan"
                minLength={2}
                maxLength={100}
                required
              />
            </label>
          )}
          {mode !== "reset-password" && (
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                maxLength={254}
                required
              />
            </label>
          )}
          {mode !== "forgot-password" && (
            <label>
              <span className="auth-label-row">
                Password{" "}
                {mode === "login" && (
                  <Link href="/forgot-password">Forgot password?</Link>
                )}
              </span>
              <span className="auth-password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </label>
          )}
          {mode === "reset-password" && (
            <label>
              Confirm password
              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </label>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : copy.action}
            <span aria-hidden="true">→</span>
          </button>
          {mode === "signup" && (
            <p className="auth-hint">
              Use a unique password with at least 12 characters.
            </p>
          )}
        </form>
      )}
      <p className="auth-switch">
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
