import Link from "next/link";

const updatedAt = "August 2, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-on-surface antialiased">
      <article className="mx-auto max-w-3xl rounded-xl border border-outline-variant bg-white p-6 shadow-stitch sm:p-10">
        <Link className="text-label-sm font-bold text-primary hover:underline" href="/">
          TengeGuard
        </Link>
        <h1 className="mt-5 font-display text-[50px] font-bold leading-none sm:text-[58px]">Privacy Policy</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">Last updated: {updatedAt}</p>

        <section className="mt-8 space-y-4 text-body-md leading-7 text-on-surface-variant">
          <p>
            TengeGuard helps users identify paid subscriptions and forecast recurring charges from bank transaction history that they explicitly authorize.
          </p>
          <p>
            We use Google Sign-In only to create a user session and receive the user&apos;s name, email address, and profile image. TengeGuard does not request access to Gmail messages.
          </p>
        </section>

        <PolicySection title="Google Account Data">
          TengeGuard may access only your Google account identifier, email address, profile name, and profile image for authentication and account display.
        </PolicySection>

        <PolicySection title="Bank Transaction Data">
          After explicit consent through the bank connection provider, TengeGuard processes read-only account and transaction history to identify recurring paid charges, estimate billing cycles, and forecast the next expected charge. TengeGuard cannot initiate payments, transfers, or withdrawals.
        </PolicySection>

        <PolicySection title="Data Sharing">
          We do not sell user data or share financial transaction details with advertisers. Telegram notifications are sent only when a user explicitly connects Telegram.
        </PolicySection>

        <PolicySection title="Storage and Security">
          Authentication sessions are stored in secure HTTP-only cookies. Bank connection identifiers and subscription results are stored using protected production storage. Provider credentials are handled server-side and are never exposed to the browser.
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
      <h2 className="font-display text-[30px] font-bold leading-none text-on-surface">{title}</h2>
      <p className="mt-2 text-body-md leading-7 text-on-surface-variant">{children}</p>
    </section>
  );
}
