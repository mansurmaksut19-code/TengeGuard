import Link from "next/link";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";

const updatedAt = "July 30, 2026";

const controls = [
  {
    title: "Google OAuth only",
    text: "TengeGuard never asks for a Gmail password. Users grant access through Google's official OAuth screen."
  },
  {
    title: "Gmail read-only",
    text: "Gmail access is used only to scan subscription-related receipts, renewal notices, trial emails, free-plan notices, and cancellation confirmations."
  },
  {
    title: "No Gmail modification",
    text: "TengeGuard does not send emails, delete emails, modify Gmail, create labels, or change mailbox settings."
  },
  {
    title: "No fake subscriptions",
    text: "If there is no real account evidence, TengeGuard shows an empty result instead of inventing subscriptions."
  },
  {
    title: "User-controlled access",
    text: "Users can revoke Google access at any time from their Google Account permissions page."
  },
  {
    title: "Telegram boundaries",
    text: "Telegram is used only for reminders and account-linked subscription actions after the user connects the bot."
  }
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-on-surface antialiased">
      <article className="mx-auto max-w-5xl rounded-2xl border border-outline-variant bg-white p-6 shadow-stitch sm:p-10">
        <Link className="text-label-sm font-bold text-primary hover:underline" href="/">
          TengeGuard
        </Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-soft text-emerald-dark">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight">Security at TengeGuard</h1>
            <p className="mt-3 text-body-md text-on-surface-variant">Last updated: {updatedAt}</p>
            <p className="mt-6 text-body-lg leading-8 text-on-surface-variant">
              TengeGuard is built around a simple principle: users should understand subscriptions without giving up control of their accounts.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {controls.map((control) => (
              <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5" key={control.title}>
                <div className="mb-4 flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <h2 className="font-display text-xl font-bold">{control.title}</h2>
                </div>
                <p className="text-body-md leading-7 text-on-surface-variant">{control.text}</p>
              </section>
            ))}
          </div>
        </div>

        <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-soft p-5">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-emerald-dark" />
            <p className="text-body-md leading-7 text-emerald-dark">
              TengeGuard uses Gmail data only for subscription discovery and reminders. It does not sell Google user data, use Gmail data for ads, or share Gmail content with advertisers.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
