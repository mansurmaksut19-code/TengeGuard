import Link from "next/link";

const updatedAt = "July 4, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-on-surface antialiased">
      <article className="mx-auto max-w-3xl rounded-xl border border-outline-variant bg-white p-6 shadow-stitch sm:p-10">
        <Link className="text-label-sm font-bold text-primary hover:underline" href="/">
          TengeGuard
        </Link>
        <h1 className="mt-5 font-display text-4xl font-bold leading-tight">Privacy Policy</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">Last updated: {updatedAt}</p>

        <section className="mt-8 space-y-4 text-body-md leading-7 text-on-surface-variant">
          <p>
            TengeGuard helps users find subscriptions, free plans, trial periods, renewal notices, and billing evidence from their own account data.
          </p>
          <p>
            We use Google Sign-In to create a user session. If a user chooses to connect Gmail, TengeGuard requests Gmail read-only access to scan emails for subscription-related receipts and notices.
          </p>
        </section>

        <PolicySection title="Google User Data">
          TengeGuard may access your Google account email, profile name, profile image, and, only after explicit Gmail connection, Gmail messages that match subscription, receipt, billing, renewal, free plan, or trial-related searches.
        </PolicySection>

        <PolicySection title="How We Use Gmail Data">
          Gmail data is used only to identify real subscription evidence, including provider name, billing or renewal dates, trial end dates, free plan indicators, costs, and cancellation hints. We do not send email, delete email, modify Gmail, or use Gmail data for advertising.
        </PolicySection>

        <PolicySection title="Data Sharing">
          We do not sell user data. We do not share Gmail content with advertisers. Telegram notifications are sent only when a user explicitly connects Telegram.
        </PolicySection>

        <PolicySection title="Storage and Security">
          Authentication sessions are stored in secure HTTP-only cookies. Gmail access tokens are handled server-side for scanning and are protected by application security controls. Users can revoke Google access at any time from their Google Account permissions page.
        </PolicySection>

        <PolicySection title="Data Deletion">
          Users can disconnect Google access from their Google Account settings. Users may also contact us to request deletion of TengeGuard account data.
        </PolicySection>

        <PolicySection title="Contact">
          For privacy questions or deletion requests, contact: mansurmaksut19@gmail.com
        </PolicySection>
      </article>
    </main>
  );
}

function PolicySection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="mt-7">
      <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
      <p className="mt-2 text-body-md leading-7 text-on-surface-variant">{children}</p>
    </section>
  );
}
