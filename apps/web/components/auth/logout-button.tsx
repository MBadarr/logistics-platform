"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <button className="dashboard-logout" onClick={logout} disabled={busy}>
        {busy ? "Signing out…" : "Sign out ↗"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
