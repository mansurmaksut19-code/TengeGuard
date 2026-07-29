import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Laptop,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
  Smartphone,
  Sparkles
} from "lucide-react";

function LogoMark({ className = "h-full w-full" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="TengeGuard" className={`${className} object-cover`} src="/tengeguard-mark.jpg" />
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fb] text-on-surface antialiased">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.16),transparent_32rem),radial-gradient(circle_at_80%_0%,rgba(30,64,175,0.14),transparent_30rem),linear-gradient(180deg,#ffffff_0%,#f6f8fb_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4 rounded-[24px] border border-white/70 bg-white/75 px-4 py-3 shadow-stitch backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-stitch">
                <LogoMark />
              </div>
              <div>
                <h1 className="font-display text-[18px] font-extrabold leading-5 text-primary">TengeGuard</h1>
                <p className="text-[12px] font-bold text-on-surface-variant">Subscription control center</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-soft px-3 py-2 text-[12px] font-extrabold text-emerald-dark sm:flex">
              <LockKeyhole className="h-4 w-4" />
              Read-only access
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
            <div className="min-w-0">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-2 text-[12px] font-extrabold uppercase text-primary shadow-stitch">
                <Sparkles className="h-4 w-4" />
                Только реальные данные, без моков
              </div>

              <h2 className="max-w-3xl font-display text-[44px] font-extrabold leading-[0.98] tracking-[-0.02em] text-[#111827] sm:text-[64px]">
                Найдите все подписки до следующего списания
              </h2>

              <p className="mt-6 max-w-2xl text-[17px] font-medium leading-8 text-on-surface-variant">
                Подключите Google, выберите режим интерфейса и откройте личный дашборд: платные подписки, бесплатные тарифы, trial-периоды, доказательства из Gmail и напоминания через Telegram.
              </p>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                <ModeButton mode="desktop" primary title="Открыть с ноутбука" icon={Laptop} />
                <ModeButton mode="mobile" title="Открыть с телефона" icon={Smartphone} />
              </div>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <TrustItem icon={GoogleMark} title="Google OAuth" text="официальный вход" />
                <TrustItem icon={MailCheck} title="Gmail proofs" text="письма и чеки" />
                <TrustItem icon={ShieldCheck} title="No fake data" text="только доказательства" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-primary/10 via-white to-emerald-accent/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[32px] border border-white bg-white shadow-[0_30px_100px_-55px_rgba(15,23,42,0.75)]">
                <div className="border-b border-outline-variant bg-white px-5 py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-outline-variant bg-white">
                        <LogoMark />
                      </div>
                      <div>
                        <p className="text-[12px] font-extrabold uppercase text-on-surface-variant">Dashboard preview</p>
                        <h3 className="font-display text-[22px] font-extrabold text-[#111827]">TengeGuard Intelligence</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-soft px-3 py-2 text-[12px] font-extrabold text-emerald-dark">
                      <CheckCircle2 className="h-4 w-4" />
                      verified
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 bg-[#fbfcfe] p-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <PreviewMetric icon={BarChart3} label="Monthly risk" value="Real data" />
                    <PreviewMetric icon={Clock3} label="Trials" value="End dates" />
                    <PreviewMetric icon={DatabaseZap} label="Sources" value="Gmail + banks" />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                    <div className="rounded-[24px] border border-outline-variant bg-white p-5 shadow-stitch">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-[12px] font-extrabold uppercase text-on-surface-variant">Subscription graph</p>
                          <h4 className="font-display text-[20px] font-extrabold">Платные, free и trial</h4>
                        </div>
                        <span className="rounded-full bg-surface-container px-3 py-1 text-[12px] font-bold text-on-surface-variant">auto scan</span>
                      </div>
                      <div className="flex items-end gap-3 pt-8">
                        <GraphBar height="h-24" tone="bg-primary" />
                        <GraphBar height="h-36" tone="bg-emerald-accent" />
                        <GraphBar height="h-20" tone="bg-amber-400" />
                        <GraphBar height="h-32" tone="bg-primary/75" />
                        <GraphBar height="h-16" tone="bg-emerald-accent/75" />
                        <GraphBar height="h-28" tone="bg-primary/90" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <PreviewRow title="Дата окончания найдена" meta="trial / free period" tone="emerald" />
                      <PreviewRow title="Есть Gmail-доказательство" meta="receipt or renewal email" tone="primary" />
                      <PreviewRow title="Telegram напоминание готово" meta="before charge date" tone="amber" />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-primary/10 bg-primary px-5 py-4 text-on-primary shadow-stitch">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[12px] font-extrabold uppercase text-on-primary/70">Next step</p>
                        <p className="mt-1 max-w-xl text-[15px] font-semibold leading-6 text-on-primary/90">
                          Выберите режим, затем TengeGuard откроет официальный Google-вход и начнет искать реальные подписки.
                        </p>
                      </div>
                      <Check className="h-8 w-8 shrink-0 text-emerald-accent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-outline-variant bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-label-sm font-black uppercase text-primary">Тарифы TengeGuard</p>
            <h2 className="mt-3 font-display text-[36px] font-extrabold leading-tight text-[#111827] sm:text-[48px]">
              Начните бесплатно, затем подключите полный контроль
            </h2>
            <p className="mt-4 text-body-lg leading-7 text-on-surface-variant">
              Бесплатный доступ на 14 дней помогает проверить, какие подписки найдутся. Полный план открывает постоянный мониторинг, историю, уведомления и обслуживание подписок.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-2">
            <PricingCard
              badge="14 дней"
              description="Пробный период для проверки Gmail-скана, бесплатных тарифов, trial-периодов и дат списаний."
              features={[
                "Gmail read-only подключение",
                "Поиск платных, free и trial-подписок",
                "Даты окончания пробных периодов",
                "Доказательства из писем"
              ]}
              price="0 ₸"
              title="Бесплатный старт"
            />
            <PricingCard
              badge="Полный доступ"
              description="Для постоянного контроля подписок, уведомлений и полного обслуживания аккаунта."
              features={[
                "Все из бесплатного плана",
                "Telegram-уведомления о списаниях",
                "История текущих и отмененных подписок",
                "Подготовка к банковским интеграциям",
                "Приоритетный deep scan"
              ]}
              highlighted
              price="200 ₸ / месяц"
              secondaryPrice="2000 ₸ / год"
              title="TengeGuard Full"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function PricingCard({
  badge,
  description,
  features,
  highlighted = false,
  price,
  secondaryPrice,
  title
}: {
  badge: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  price: string;
  secondaryPrice?: string;
  title: string;
}) {
  return (
    <article
      className={`flex min-h-[460px] flex-col rounded-[28px] border p-6 shadow-stitch ${
        highlighted
          ? "border-primary bg-primary text-on-primary shadow-float"
          : "border-outline-variant bg-surface-container-lowest text-on-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase ${
              highlighted ? "bg-white/15 text-on-primary" : "bg-emerald-soft text-emerald-dark"
            }`}
          >
            {badge}
          </span>
          <h3 className="mt-5 font-display text-[28px] font-extrabold">{title}</h3>
        </div>
      </div>

      <div className="mt-5">
        <p className="font-display text-[34px] font-extrabold leading-tight">{price}</p>
        {secondaryPrice ? (
          <p className={`mt-1 text-body-md font-bold ${highlighted ? "text-on-primary/70" : "text-on-surface-variant"}`}>
            или {secondaryPrice}
          </p>
        ) : null}
      </div>

      <p className={`mt-5 text-body-md leading-7 ${highlighted ? "text-on-primary/78" : "text-on-surface-variant"}`}>
        {description}
      </p>

      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li className="flex items-start gap-3 text-body-md font-semibold leading-6" key={feature}>
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                highlighted ? "bg-white text-primary" : "bg-emerald-soft text-emerald-dark"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <form action="/api/device-mode" className="mt-auto pt-8" method="GET">
        <input name="mode" type="hidden" value="desktop" />
        <button
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-label-sm font-black transition hover:-translate-y-0.5 active:scale-[0.99] ${
            highlighted ? "bg-white text-primary hover:bg-surface-container" : "bg-primary text-on-primary hover:bg-primary/90"
          }`}
          type="submit"
        >
          Начать
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </article>
  );
}

function ModeButton({
  icon: Icon,
  mode,
  primary = false,
  title
}: {
  icon: typeof Laptop;
  mode: "desktop" | "mobile";
  primary?: boolean;
  title: string;
}) {
  return (
    <form action="/api/device-mode" method="GET">
      <input name="mode" type="hidden" value={mode} />
      <button
        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left text-[14px] font-extrabold shadow-stitch transition hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.99] ${
          primary ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-white text-on-surface"
        }`}
        type="submit"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${primary ? "bg-white/15" : "bg-surface-container"}`}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 break-words">{title}</span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}

function TrustItem({ icon: Icon, text, title }: { icon: React.ElementType; text: string; title: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-white/82 p-4 shadow-stitch backdrop-blur">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-[13px] font-extrabold text-on-surface">{title}</p>
      <p className="mt-1 text-[12px] font-semibold text-on-surface-variant">{text}</p>
    </div>
  );
}

function PreviewMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-outline-variant bg-white p-4 shadow-stitch">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 text-[12px] font-extrabold uppercase text-on-surface-variant">{label}</p>
      <p className="mt-1 break-words font-display text-[20px] font-extrabold text-[#111827]">{value}</p>
    </div>
  );
}

function GraphBar({ height, tone }: { height: string; tone: string }) {
  return <div className={`w-full rounded-t-2xl ${height} ${tone}`} />;
}

function PreviewRow({ meta, title, tone }: { meta: string; title: string; tone: "emerald" | "primary" | "amber" }) {
  const toneClass = {
    amber: "bg-amber-soft text-amber-dark",
    emerald: "bg-emerald-soft text-emerald-dark",
    primary: "bg-surface-container text-primary"
  }[tone];

  return (
    <div className="rounded-[22px] border border-outline-variant bg-white p-4 shadow-stitch">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Check className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="break-words text-[14px] font-extrabold text-on-surface">{title}</p>
          <p className="mt-1 break-words text-[12px] font-semibold text-on-surface-variant">{meta}</p>
        </div>
      </div>
    </div>
  );
}
