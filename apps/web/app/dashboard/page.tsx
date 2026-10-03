import { auth } from "../../lib/auth/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "../../components/auth/logout-button";
import { Files } from "../../components/files";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");
  let response: Response;
  try {
    const { data, error } = await auth.token();
    if (error || !data?.token) throw new Error("Unable to obtain a Neon token");
    response = await fetch(
      new URL("/auth/me", process.env.API_URL ?? "http://localhost:3002"),
      {
        headers: { Authorization: `Bearer ${data.token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch {
    return (
      <main className="min-h-svh bg-canvas px-[max(1.5rem,calc((100vw-68.75rem)/2))] py-8 text-ink [&>header]:flex [&>header]:items-center [&>header]:justify-between [&>header]:border-b [&>header]:border-divider [&>header]:pb-7">
        <h1>Your workspace is temporarily unavailable.</h1>
        <p>Please try again shortly.</p>
      </main>
    );
  }
  if (response.status === 401) redirect("/login");
  if (!response.ok)
    return (
      <main className="min-h-svh bg-canvas px-[max(1.5rem,calc((100vw-68.75rem)/2))] py-8 text-ink [&>header]:flex [&>header]:items-center [&>header]:justify-between [&>header]:border-b [&>header]:border-divider [&>header]:pb-7">
        <h1>We could not load your account.</h1>
        <p>Please try again shortly.</p>
      </main>
    );
  const { user } = (await response.json()) as {
    user: { name: string; email: string };
  };
  return (
    <main className="min-h-svh bg-canvas px-[max(1.5rem,calc((100vw-68.75rem)/2))] py-8 text-ink [&>header]:flex [&>header]:items-center [&>header]:justify-between [&>header]:border-b [&>header]:border-divider [&>header]:pb-7">
      <header>
        <span className="text-2xl font-bold tracking-tight">↗ logistics.</span>
        <LogoutButton />
      </header>
      <section className="mx-auto mt-16 mb-24 max-w-180 account:mt-24 [&>h1]:mb-5 [&>h1]:text-3xl account:[&>h1]:text-5xl [&>h1]:font-medium [&>h1]:tracking-tight [&>p]:leading-loose [&>p]:text-muted">
        <p className="mb-4.5 text-xs tracking-widest text-eyebrow!">
          YOUR WORKSPACE
        </p>
        <h1>Welcome aboard, {user.name.split(" ")[0]}.</h1>
        <p>You’re signed in and ready for your next move.</p>
        <div className="my-8 flex flex-wrap items-center gap-4.5 rounded-2xl border border-card-border bg-white p-4.5 account:flex-nowrap account:p-6.5 [&>span:first-child]:grid [&>span:first-child]:size-11 [&>span:first-child]:shrink-0 [&>span:first-child]:place-items-center [&>span:first-child]:rounded-full [&>span:first-child]:bg-success [&>span:first-child]:text-link [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted [&_p]:wrap-anywhere">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>{user.name}</strong>
            <p>{user.email}</p>
          </div>
          <span className="ml-auto rounded-full bg-success px-2.5 py-2 text-xs whitespace-nowrap text-link">
            Signed in
          </span>
        </div>
        <p className="text-sm">
          Your account is ready. Shipment and fleet management will appear here
          as your workspace grows.
        </p>
        <Files />
      </section>
    </main>
  );
}
