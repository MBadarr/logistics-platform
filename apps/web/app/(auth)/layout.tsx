import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-svh grid-cols-1 bg-canvas text-ink auth:grid-cols-[minmax(22.5rem,46%)_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-deep px-[12%] py-11 text-white auth:flex after:pointer-events-none after:absolute after:-right-82.5 after:bottom-[5%] after:size-120 after:rounded-full after:border after:border-white/[0.043] after:shadow-orbit">
        <Link
          className="flex items-center gap-2.5 text-2xl font-bold tracking-tight"
          href="/"
        >
          <span
            className="grid size-9 place-items-center rounded-lg bg-accent text-brand-deep"
            aria-hidden="true"
          >
            ↗
          </span>{" "}
          logistics<span className="-ml-2 text-accent">.</span>
        </Link>
        <div className="z-10 max-w-108 py-18 [&_h2]:my-6 [&_h2]:text-4xl lg:[&_h2]:text-5xl xl:[&_h2]:text-6xl [&_h2]:leading-tight [&_h2]:font-medium [&_h2]:tracking-tighter [&>p]:text-base [&>p]:leading-loose [&>p]:text-story-body">
          <span className="inline-flex items-center gap-2 text-xs tracking-widest text-story-pill [&>span]:size-1.5 [&>span]:rounded-full [&>span]:bg-accent">
            <span /> CONNECTED OPERATIONS
          </span>
          <h2>
            Every journey.
            <br />
            One workspace.
          </h2>
          <p>
            A clearer view of your logistics.
            <br />
            From the first mile to the last.
          </p>
          <div className="mt-12 grid gap-3.5" aria-hidden="true">
            {[
              ["01", "Plan the move", "Bring your team together"],
              ["02", "Keep it moving", "Your operations, connected"],
              ["03", "Go further", "Make room for what’s next"],
            ].map(([number, title, subtitle]) => (
              <div
                className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.016] p-4 [&>span]:rounded-lg [&>span]:bg-accent/[0.086] [&>span]:p-2.5 [&>span]:text-xs [&>span]:text-accent [&>div]:flex [&>div]:flex-col [&>div]:gap-1 [&_strong]:text-sm [&_strong]:font-medium [&_small]:text-xs [&_small]:text-story-detail [&>b]:ml-auto [&>b]:font-normal [&>b]:text-accent"
                key={number}
              >
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{subtitle}</small>
                </div>
                <b>↗</b>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-story-footer">
          Built for the people who move things forward.
        </p>
      </aside>
      <div className="flex min-h-svh flex-col items-center justify-center px-6 py-8 auth:min-h-0 auth:px-10 auth:pt-18 auth:pb-8">
        <div className="self-start text-2xl font-bold text-brand auth:hidden">
          logistics.
        </div>
        {children}
        <p className="mt-7 text-xs text-subtle">
          Your next move starts here.
        </p>
      </div>
    </main>
  );
}
