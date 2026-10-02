import Link from "next/link";
import "./auth.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <Link className="auth-brand" href="/">
          <span className="auth-brand-mark" aria-hidden="true">
            ↗
          </span>{" "}
          logistics<span className="auth-brand-dot">.</span>
        </Link>
        <div className="auth-story-content">
          <span className="auth-story-pill">
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
          <div className="auth-route-art" aria-hidden="true">
            {[
              ["01", "Plan the move", "Bring your team together"],
              ["02", "Keep it moving", "Your operations, connected"],
              ["03", "Go further", "Make room for what’s next"],
            ].map(([number, title, subtitle]) => (
              <div className="auth-route-node" key={number}>
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
        <p className="auth-story-footer">
          Built for the people who move things forward.
        </p>
      </aside>
      <div className="auth-main">
        <div className="auth-mobile-brand">logistics.</div>
        {children}
        <p className="auth-footer">Your next move starts here.</p>
      </div>
    </main>
  );
}
