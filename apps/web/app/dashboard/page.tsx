import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "../../components/auth/logout-button";
import "./dashboard.css";

export default async function DashboardPage() {
  const session = (await cookies()).get("logistics_session");
  if (!session) redirect("/login");
  let response: Response;
  try {
    response = await fetch(
      new URL("/auth/me", process.env.API_URL ?? "http://localhost:3002"),
      {
        headers: { Cookie: `logistics_session=${session.value}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch {
    return (
      <main className="dashboard-shell">
        <h1>Your workspace is temporarily unavailable.</h1>
        <p>Please try again shortly.</p>
      </main>
    );
  }
  if (response.status === 401) redirect("/login");
  if (!response.ok)
    return (
      <main className="dashboard-shell">
        <h1>We could not load your account.</h1>
        <p>Please try again shortly.</p>
      </main>
    );
  const { user } = (await response.json()) as {
    user: { name: string; email: string };
  };
  return (
    <main className="dashboard-shell">
      <header>
        <span className="dashboard-brand">↗ logistics.</span>
        <LogoutButton />
      </header>
      <section className="dashboard-welcome">
        <p className="dashboard-eyebrow">YOUR WORKSPACE</p>
        <h1>Welcome aboard, {user.name.split(" ")[0]}.</h1>
        <p>You’re signed in and ready for your next move.</p>
        <div className="dashboard-account">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>{user.name}</strong>
            <p>{user.email}</p>
          </div>
          <span className="dashboard-active">Signed in</span>
        </div>
        <p className="dashboard-note">
          Your account is ready. Shipment and fleet management will appear here
          as your workspace grows.
        </p>
      </section>
    </main>
  );
}
