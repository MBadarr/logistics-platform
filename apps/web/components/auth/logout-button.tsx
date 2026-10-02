"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Alert } from "@repo/ui/alert";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Unable to sign out. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <Button variant="outline" onClick={logout} loading={busy}>
        {busy ? "Signing out…" : "Sign out ↗"}
      </Button>
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
