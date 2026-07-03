import { Laptop, ShieldCheck, Smartphone } from "lucide-react";

function TengeGuardAvatar({ className = "h-full w-full" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="TengeGuard"
      className={`${className} object-cover`}
      src="/tengeguard-mark.jpg"
    />
  );
}

function TengeGuardFullLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="TengeGuard logo" className="h-full w-full object-contain" src="/tengeguard-logo.jpg" />
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
    <main className="tg-shell-grid min-h-screen overflow-hidden bg-background text-on-surface antialiased">
      <div className="pointer-events-none fixed right-[-10rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-12rem] left-[-12rem] h-[30rem] w-[30rem] rounded-full bg-sky-200/45 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl border border-outline-variant bg-white shadow-stitch">
              <TengeGuardAvatar />
            </div>
            <div>
              <h1 className="font-display text-headline-md font-extrabold leading-7 text-primary">TengeGuard</h1>
              <p className="text-label-sm font-semibold text-on-surface-variant">Fintech Security</p>
            </div>
          </div>
          <span className="hidden rounded-full border border-emerald-200 bg-emerald-soft px-3 py-1 text-label-sm font-bold text-emerald-dark sm:inline-flex">
            Gmail read-only
          </span>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-w-0">
            <div className="mb-6 flex w-fit items-center gap-4 rounded-2xl border border-outline-variant bg-white/90 p-3 pr-6 shadow-stitch backdrop-blur">
              <div className="h-20 w-20 overflow-hidden rounded-xl bg-white ring-1 ring-outline-variant">
                <TengeGuardAvatar />
              </div>
              <div className="min-w-0">
                <p className="text-label-sm font-black uppercase leading-5 text-emerald-dark">Verified subscription guard</p>
                <p className="mt-1 max-w-[260px] text-body-md font-bold leading-6 text-on-surface">Только реальные Gmail-доказательства, без фейковых подписок.</p>
              </div>
            </div>
            <p className="mb-4 inline-flex rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-label-sm font-bold uppercase text-on-surface-variant">
              Сначала режим, потом Google
            </p>
            <h2 className="max-w-xl font-display text-4xl font-bold leading-tight text-on-surface sm:text-display">
              Выберите, как открыть TengeGuard
            </h2>
            <p className="mt-5 max-w-lg text-body-lg leading-7 text-on-surface-variant">
              После выбора режима система попросит подключить Gmail. Без Gmail-доступа дашборд не откроется, потому что TengeGuard показывает только реальные подписки и доказательства.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-label-sm font-bold text-on-surface-variant">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-stitch">
                <GoogleMark />
                Official Google OAuth
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-stitch">
                <ShieldCheck className="h-4 w-4 text-emerald-accent" />
                Только чтение Gmail
              </span>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2 rounded-2xl border border-outline-variant bg-white/90 p-5 shadow-stitch backdrop-blur">
              <div className="mx-auto h-36 max-w-md">
                <TengeGuardFullLogo />
              </div>
            </div>
            <ModeCard
              body="Компактный app-shell, нижняя навигация и интерфейс как мобильное приложение. Подходит для проверки подписок с телефона."
              icon={Smartphone}
              label="Режим телефона"
              meta="Mobile dashboard"
              mode="mobile"
            />
            <ModeCard
              body="Широкий SaaS-dashboard с боковой навигацией, большими метриками и плотной аналитикой для ноутбука."
              icon={Laptop}
              label="Режим ноутбука"
              meta="Desktop dashboard"
              mode="desktop"
              primary
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function ModeCard({
  body,
  icon: Icon,
  label,
  meta,
  mode,
  primary = false
}: {
  body: string;
  icon: typeof Smartphone;
  label: string;
  meta: string;
  mode: "mobile" | "desktop";
  primary?: boolean;
}) {
  return (
    <form action="/api/device-mode" className="contents" method="GET">
      <input name="mode" type="hidden" value={mode} />
      <button
        className={`group flex min-h-[300px] w-full min-w-0 flex-col justify-between rounded-xl border p-6 text-left shadow-stitch transition hover:-translate-y-1 hover:shadow-soft active:scale-[0.99] ${
          primary ? "border-primary/30 bg-primary text-on-primary" : "border-outline-variant bg-white text-on-surface"
        }`}
        type="submit"
      >
        <div className="min-w-0">
          <div className={`mb-6 grid h-14 w-14 place-items-center rounded-xl ${primary ? "bg-white/15" : "bg-surface-container"}`}>
            <Icon className="h-7 w-7" />
          </div>
          <p className={`text-label-sm font-bold uppercase leading-5 ${primary ? "text-on-primary/70" : "text-on-surface-variant"}`}>{meta}</p>
          <h3 className="mt-2 font-display text-headline-lg-mobile font-bold leading-8">{label}</h3>
          <p className={`mt-4 text-body-md leading-7 ${primary ? "text-on-primary/80" : "text-on-surface-variant"}`}>{body}</p>
        </div>
        <span className={`mt-8 inline-flex items-center justify-center rounded-lg px-4 py-3 text-label-sm font-bold ${primary ? "bg-white text-primary" : "bg-primary text-on-primary"}`}>
          Выбрать режим
        </span>
      </button>
    </form>
  );
}
