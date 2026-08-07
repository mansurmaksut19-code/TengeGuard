import Link from "next/link";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";

const updatedAt = "August 2, 2026";

const controls = [
  {
    title: "Google Sign-In only",
    text: "Google is used only for authentication. TengeGuard requests the user's basic profile and does not request access to Gmail messages."
  },
  {
    title: "Read-only bank access",
    text: "Bank connections request only accounts and transaction history. TengeGuard cannot initiate transfers, payments, or withdrawals."
  },
  {
    title: "Paid subscriptions only",
    text: "A subscription is shown only when recurring bank transactions provide evidence of a real paid charge."
  },
  {
    title: "No fake subscriptions",
    text: "If there is no real account evidence, TengeGuard shows an empty result instead of inventing subscriptions."
  },
  {
    title: "User-controlled access",
    text: "Users can revoke Google authentication or disconnect their bank connection through the relevant provider."
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
            <h1 className="mt-5 font-display text-[50px] font-bold leading-none sm:text-[58px]">Security at TengeGuard</h1>
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
                  <h2 className="font-display text-[30px] font-bold leading-none">{control.title}</h2>
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
              TengeGuard does not read Gmail. Bank data is used only to identify recurring paid subscriptions, calculate expected charge dates, and send reminders requested by the user.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
