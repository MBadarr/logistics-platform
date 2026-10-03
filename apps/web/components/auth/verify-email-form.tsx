"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import { Alert } from "@repo/ui/alert";
import { authClient } from "../../lib/auth/client";

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function sendCode() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      if (result.error) throw new Error(result.error.message);
      setMessage("Check your email for a verification code.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to send a code. Try again.");
    } finally { setBusy(false); }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const otp = String(new FormData(event.currentTarget).get("otp") ?? "").trim();
    setBusy(true);
    setError("");
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp });
      if (result.error) throw new Error(result.error.message);
      const session = await authClient.getSession();
      router.replace(session.data?.user ? "/dashboard" : "/login");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to verify your email.");
    } finally { setBusy(false); }
  }

  if (!email) return <section className="my-auto py-14"><p>Sign in or create an account to verify your email.</p><Link href="/login">Back to sign in</Link></section>;
  return (
    <section className="my-auto w-full max-w-100 py-14">
      <h1 className="text-3xl font-medium">Verify your email.</h1>
      <p className="my-5 text-sm text-muted">Enter the code sent to {email}. If you haven’t received one, request a code below.</p>
      {message && <p role="status" className="my-4 text-sm">{message}</p>}
      <form onSubmit={verify} className="flex flex-col gap-5">
        <Field>Verification code<Input name="otp" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required /></Field>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" fullWidth loading={busy}>Verify email</Button>
      </form>
      <Button variant="outline" onClick={sendCode} disabled={busy}>Send verification code</Button>
      <p className="mt-6 text-sm"><Link href="/login">Back to sign in</Link></p>
    </section>
  );
}
