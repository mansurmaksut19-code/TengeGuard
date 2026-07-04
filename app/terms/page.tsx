import Link from "next/link";

const updatedAt = "July 4, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-on-surface antialiased">
      <article className="mx-auto max-w-3xl rounded-xl border border-outline-variant bg-white p-6 shadow-stitch sm:p-10">
        <Link className="text-label-sm font-bold text-primary hover:underline" href="/">
          TengeGuard
        </Link>
        <h1 className="mt-5 font-display text-4xl font-bold leading-tight">Terms of Service</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">Last updated: {updatedAt}</p>

        <TermsSection title="Service">
          TengeGuard is a subscription discovery and reminder tool. It helps users analyze their own account data to find paid subscriptions, free plans, trial periods, renewal notices, and cancellation information.
        </TermsSection>

        <TermsSection title="User Permission">
          Users must only connect accounts they own or are authorized to use. Gmail scanning is optional and requires explicit user consent through Google OAuth.
        </TermsSection>

        <TermsSection title="No Financial or Legal Advice">
          TengeGuard provides informational tools. It does not provide financial, legal, tax, or banking advice. Users are responsible for verifying subscription status directly with each provider.
        </TermsSection>

        <TermsSection title="Cancellation Actions">
          When TengeGuard shows cancellation guidance, it may provide links, instructions, or status tracking. Final cancellation depends on the provider's own rules and systems.
        </TermsSection>

        <TermsSection title="Acceptable Use">
          Users must not misuse the service, attempt unauthorized access, interfere with the platform, or connect accounts without permission.
        </TermsSection>

        <TermsSection title="Changes">
          We may update these terms as the product evolves. Continued use of TengeGuard means you accept the updated terms.
        </TermsSection>

        <TermsSection title="Contact">
          For questions, contact: mansurmaksut19@gmail.com
        </TermsSection>
      </article>
    </main>
  );
}

function TermsSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="mt-7">
      <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
      <p className="mt-2 text-body-md leading-7 text-on-surface-variant">{children}</p>
    </section>
  );
}
