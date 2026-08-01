"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  CheckCircle2,
  Clock3,
  Landmark,
  Laptop,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
  Smartphone
} from "lucide-react";

type Locale = "kk" | "en" | "ru";
type DeviceMode = "desktop" | "mobile";

const localeNames: Record<Locale, string> = {
  kk: "Қазақша",
  en: "English",
  ru: "Русский"
};

const content = {
  ru: {
    navProduct: "Как работает",
    navPricing: "Тарифы",
    security: "Безопасность",
    badge: "Только подтверждённые данные",
    title: "Все подписки и даты списаний в одном месте",
    subtitle:
      "TengeGuard находит платные, бесплатные и пробные подписки по разрешённым источникам и предупреждает до следующего списания.",
    freeTitle: "Начать бесплатно",
    freeMeta: "14 дней · Gmail read-only",
    proTitle: "Выбрать Pro",
    proMeta: "200 ₸/мес · 2 000 ₸/год",
    privacyNote: "Мы не отправляем, не изменяем и не удаляем письма.",
    desktop: "Ноутбук",
    mobile: "Телефон",
    previewTitle: "Контроль подписок",
    previewStatus: "Защита активна",
    metricActive: "Активные",
    metricNext: "Ближайшая дата",
    metricSources: "Источники",
    sourceValue: "Gmail + банки",
    paid: "Платные",
    free: "Бесплатные",
    trials: "Пробные",
    howEyebrow: "Три шага",
    howTitle: "Подключение без ручного ввода",
    steps: [
      ["Разрешите чтение Gmail", "Google открывает официальный экран OAuth. TengeGuard получает только Gmail read-only."],
      ["Получите реальные подписки", "Система анализирует чеки, продления, free-тарифы, trial-периоды и банковские списания."],
      ["Получайте напоминания", "Telegram заранее сообщает о списании или завершении пробного периода."]
    ],
    dataTitle: "Зачем нужен доступ Gmail",
    dataText:
      "Gmail read-only используется только для поиска писем о подписках, счетах, продлениях, бесплатных планах и пробных периодах. Доступ добровольный и может быть отозван в Google Account.",
    pricingEyebrow: "Простые тарифы",
    pricingTitle: "Начните бесплатно, продолжите когда будет полезно",
    trialName: "Free Trial",
    trialPrice: "0 ₸",
    trialDescription: "Полная проверка продукта в течение 14 дней.",
    trialFeatures: ["Gmail read-only", "Платные, free и trial", "Даты окончания", "Доказательства из писем"],
    proName: "TengeGuard Pro",
    proPrice: "200 ₸ / месяц",
    proYear: "или 2 000 ₸ в год",
    proDescription: "Постоянный контроль подписок и напоминания.",
    proFeatures: ["Всё из Free Trial", "Telegram-напоминания", "История подписок", "Банковские транзакции"],
    start: "Продолжить",
    footer: "Контроль подписок на основе данных пользователя"
  },
  en: {
    navProduct: "How it works",
    navPricing: "Pricing",
    security: "Security",
    badge: "Verified data only",
    title: "Every subscription and renewal date in one place",
    subtitle:
      "TengeGuard finds paid, free, and trial subscriptions from user-approved sources and warns you before the next charge.",
    freeTitle: "Start free",
    freeMeta: "14 days · Gmail read-only",
    proTitle: "Choose Pro",
    proMeta: "200 KZT/mo · 2,000 KZT/yr",
    privacyNote: "We never send, change, or delete email.",
    desktop: "Desktop",
    mobile: "Phone",
    previewTitle: "Subscription control",
    previewStatus: "Protection active",
    metricActive: "Active",
    metricNext: "Next date",
    metricSources: "Sources",
    sourceValue: "Gmail + banks",
    paid: "Paid",
    free: "Free",
    trials: "Trials",
    howEyebrow: "Three steps",
    howTitle: "Connect without manual entry",
    steps: [
      ["Allow Gmail reading", "Google opens the official OAuth screen. TengeGuard receives Gmail read-only access only."],
      ["See real subscriptions", "The system analyzes receipts, renewals, free plans, trials, and recurring bank transactions."],
      ["Receive reminders", "Telegram warns you before a charge or trial expiration."]
    ],
    dataTitle: "Why Gmail access is requested",
    dataText:
      "Gmail read-only is used only to find subscription receipts, invoices, renewals, free-plan notices, and trial messages. Access is optional and can be revoked in Google Account.",
    pricingEyebrow: "Simple pricing",
    pricingTitle: "Start free and continue when it proves useful",
    trialName: "Free Trial",
    trialPrice: "0 KZT",
    trialDescription: "Full product evaluation for 14 days.",
    trialFeatures: ["Gmail read-only", "Paid, free, and trial plans", "End dates", "Email evidence"],
    proName: "TengeGuard Pro",
    proPrice: "200 KZT / month",
    proYear: "or 2,000 KZT per year",
    proDescription: "Continuous subscription monitoring and reminders.",
    proFeatures: ["Everything in Free Trial", "Telegram reminders", "Subscription history", "Bank transactions"],
    start: "Continue",
    footer: "Subscription control based on user-owned data"
  },
  kk: {
    navProduct: "Қалай жұмыс істейді",
    navPricing: "Тарифтер",
    security: "Қауіпсіздік",
    badge: "Тек расталған деректер",
    title: "Барлық жазылымдар мен төлем күндері бір жерде",
    subtitle:
      "TengeGuard рұқсат етілген дереккөздерден ақылы, тегін және сынақ жазылымдарын тауып, келесі төлемге дейін ескертеді.",
    freeTitle: "Тегін бастау",
    freeMeta: "14 күн · Gmail тек оқу",
    proTitle: "Pro таңдау",
    proMeta: "200 ₸/ай · 2 000 ₸/жыл",
    privacyNote: "Біз хаттарды жібермейміз, өзгертпейміз және жоймаймыз.",
    desktop: "Ноутбук",
    mobile: "Телефон",
    previewTitle: "Жазылымдарды бақылау",
    previewStatus: "Қорғаныс белсенді",
    metricActive: "Белсенді",
    metricNext: "Келесі күн",
    metricSources: "Дереккөздер",
    sourceValue: "Gmail + банктер",
    paid: "Ақылы",
    free: "Тегін",
    trials: "Сынақ",
    howEyebrow: "Үш қадам",
    howTitle: "Қолмен енгізусіз қосылу",
    steps: [
      ["Gmail оқуға рұқсат беріңіз", "Google ресми OAuth экранын ашады. TengeGuard тек Gmail read-only рұқсатын алады."],
      ["Нақты жазылымдарды көріңіз", "Жүйе түбіртектерді, ұзартуларды, тегін жоспарларды, сынақ мерзімдерін және банк төлемдерін талдайды."],
      ["Ескертулер алыңыз", "Telegram төлем немесе сынақ мерзімі аяқталғанға дейін хабарлайды."]
    ],
    dataTitle: "Gmail рұқсаты не үшін қажет",
    dataText:
      "Gmail read-only тек жазылым түбіртектерін, шоттарды, ұзартуларды, тегін жоспарлар мен сынақ хабарламаларын іздеу үшін қолданылады. Рұқсат ерікті және Google Account ішінде қайтарып алынады.",
    pricingEyebrow: "Қарапайым тарифтер",
    pricingTitle: "Тегін бастаңыз, пайдалы болса жалғастырыңыз",
    trialName: "Free Trial",
    trialPrice: "0 ₸",
    trialDescription: "Өнімді 14 күн толық тексеру.",
    trialFeatures: ["Gmail тек оқу", "Ақылы, тегін және сынақ", "Аяқталу күндері", "Хаттардан дәлелдер"],
    proName: "TengeGuard Pro",
    proPrice: "200 ₸ / ай",
    proYear: "немесе жылына 2 000 ₸",
    proDescription: "Жазылымдарды тұрақты бақылау және ескертулер.",
    proFeatures: ["Free Trial мүмкіндіктері", "Telegram ескертулері", "Жазылымдар тарихы", "Банк транзакциялары"],
    start: "Жалғастыру",
    footer: "Пайдаланушы деректеріне негізделген жазылым бақылауы"
  }
} satisfies Record<Locale, Record<string, string | string[] | string[][]>>;

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("ru");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const t = content[locale];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-on-surface antialiased">
      <header className="sticky top-0 z-50 border-b border-outline-variant/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <Logo />
            <div>
              <p className="text-[17px] font-extrabold text-primary">TengeGuard</p>
              <p className="hidden text-[11px] font-semibold text-on-surface-variant sm:block">{t.footer as string}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-[13px] font-bold text-on-surface-variant lg:flex">
            <a className="transition-colors hover:text-primary" href="#how">{t.navProduct as string}</a>
            <a className="transition-colors hover:text-primary" href="#pricing">{t.navPricing as string}</a>
            <Link className="transition-colors hover:text-primary" href="/security">{t.security as string}</Link>
          </nav>

          <div aria-label="Language" className="flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
            {(Object.keys(localeNames) as Locale[]).map((item) => (
              <button
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-all sm:px-3 ${
                  locale === item ? "bg-white text-primary shadow-stitch" : "text-on-surface-variant hover:text-on-surface"
                }`}
                key={item}
                onClick={() => setLocale(item)}
                type="button"
              >
                <span className="sm:hidden">{item.toUpperCase()}</span>
                <span className="hidden sm:inline">{localeNames[item]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="border-b border-outline-variant bg-white">
        <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-20">
          <div className="animate-tg-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-soft px-3 py-2 text-[11px] font-extrabold uppercase text-emerald-dark">
              <ShieldCheck className="h-4 w-4" />
              {t.badge as string}
            </span>
            <h1 className="mt-6 max-w-3xl text-[42px] font-extrabold leading-[1.06] text-[#101828] sm:text-[58px] lg:text-[64px]">
              {t.title as string}
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] font-medium leading-8 text-on-surface-variant">
              {t.subtitle as string}
            </p>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
              <PrimaryAction title={t.freeTitle as string} meta={t.freeMeta as string} plan="free" label={t.start as string} mode={deviceMode} />
              <PrimaryAction title={t.proTitle as string} meta={t.proMeta as string} plan="pro_monthly" label={t.start as string} secondary />
            </div>

            <div className="mt-3 flex w-fit rounded-lg border border-outline-variant bg-surface-container-low p-1">
              {([
                ["desktop", Laptop, t.desktop],
                ["mobile", Smartphone, t.mobile]
              ] as const).map(([mode, Icon, label]) => (
                <button
                  aria-pressed={deviceMode === mode}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-[11px] font-bold transition-all ${deviceMode === mode ? "bg-white text-primary shadow-stitch" : "text-on-surface-variant"}`}
                  key={mode}
                  onClick={() => setDeviceMode(mode)}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  {label as string}
                </button>
              ))}
            </div>

            <p className="mt-5 flex items-center gap-2 text-[12px] font-semibold text-on-surface-variant">
              <LockKeyhole className="h-4 w-4 text-primary" />
              {t.privacyNote as string}
            </p>
          </div>

          <DashboardPreview t={t} />
        </div>
      </section>

      <section className="border-b border-outline-variant bg-[#f7f9fc] px-4 py-20 sm:px-6 lg:px-8" id="how">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-[12px] font-extrabold uppercase text-primary">{t.howEyebrow as string}</p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-tight text-[#101828] sm:text-[44px]">{t.howTitle as string}</h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {(t.steps as string[][]).map(([title, text], index) => (
              <article className="rounded-lg border border-outline-variant bg-white p-6 shadow-stitch transition-all duration-300 hover:-translate-y-1 hover:shadow-soft" key={title}>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-[13px] font-extrabold text-on-primary">{index + 1}</span>
                <h3 className="mt-5 text-[19px] font-extrabold text-[#101828]">{title}</h3>
                <p className="mt-3 text-[14px] leading-7 text-on-surface-variant">{text}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-lg border border-primary/15 bg-primary px-6 py-6 text-on-primary sm:flex-row sm:items-start">
            <MailCheck className="h-6 w-6 shrink-0 text-emerald-accent" />
            <div>
              <h3 className="text-[17px] font-extrabold">{t.dataTitle as string}</h3>
              <p className="mt-2 max-w-5xl text-[13px] font-medium leading-6 text-on-primary/80">{t.dataText as string}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8" id="pricing">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[12px] font-extrabold uppercase text-primary">{t.pricingEyebrow as string}</p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-tight text-[#101828] sm:text-[44px]">{t.pricingTitle as string}</h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <PlanCard
              description={t.trialDescription as string}
              features={t.trialFeatures as string[]}
              label={t.start as string}
              name={t.trialName as string}
              plan="free"
              price={t.trialPrice as string}
            />
            <PlanCard
              description={t.proDescription as string}
              features={t.proFeatures as string[]}
              label={t.start as string}
              name={t.proName as string}
              plan="pro_monthly"
              price={t.proPrice as string}
              secondaryPrice={t.proYear as string}
              highlighted
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-outline-variant bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-[12px] font-semibold text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><Logo small /><span>© 2026 TengeGuard</span></div>
          <div className="flex flex-wrap gap-4">
            <Link className="hover:text-primary" href="/privacy">Privacy</Link>
            <Link className="hover:text-primary" href="/security">Security</Link>
            <Link className="hover:text-primary" href="/terms">Terms</Link>
            <a className="hover:text-primary" href="mailto:mansurmaksut19@gmail.com">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={`${small ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl"} overflow-hidden border border-outline-variant bg-white`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="TengeGuard" className="h-full w-full object-cover" src="/tengeguard-mark.jpg" />
    </div>
  );
}

function PrimaryAction({ label, meta, mode = "desktop", plan, secondary = false, title }: { label: string; meta: string; mode?: DeviceMode; plan: "free" | "pro_monthly"; secondary?: boolean; title: string }) {
  return (
    <form action={plan === "free" ? "/api/device-mode" : "/api/billing/checkout"} method="GET">
      {plan === "free" ? <input name="mode" type="hidden" value={mode} /> : null}
      <input name="plan" type="hidden" value={plan} />
      <button className={`group flex w-full items-center justify-between rounded-lg border px-5 py-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft ${secondary ? "border-outline-variant bg-white text-on-surface" : "border-primary bg-primary text-on-primary"}`} type="submit">
        <span><span className="block text-[15px] font-extrabold">{title}</span><span className={`mt-1 block text-[11px] font-semibold ${secondary ? "text-on-surface-variant" : "text-on-primary/70"}`}>{meta}</span></span>
        <span className="flex items-center gap-2 text-[12px] font-extrabold">{label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
      </button>
    </form>
  );
}

function DashboardPreview({ t }: { t: Record<string, string | string[] | string[][]> }) {
  return (
    <div className="animate-tg-rise-delayed rounded-lg border border-outline-variant bg-[#f8fafc] p-4 shadow-float sm:p-5">
      <div className="rounded-lg border border-outline-variant bg-white p-5 shadow-stitch">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3"><Logo /><div><p className="text-[11px] font-bold uppercase text-on-surface-variant">TengeGuard</p><h2 className="text-[18px] font-extrabold text-[#101828]">{t.previewTitle as string}</h2></div></div>
          <span className="hidden items-center gap-2 rounded-full bg-emerald-soft px-3 py-2 text-[10px] font-extrabold text-emerald-dark sm:flex"><CheckCircle2 className="h-4 w-4" />{t.previewStatus as string}</span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <PreviewMetric icon={BarChart3} label={t.metricActive as string} value="12" />
          <PreviewMetric icon={Clock3} label={t.metricNext as string} value="7 d" />
          <PreviewMetric icon={Landmark} label={t.metricSources as string} value={t.sourceValue as string} />
        </div>

        <div className="mt-4 rounded-lg border border-outline-variant bg-[#fbfcfe] p-4">
          <div className="flex h-36 items-end gap-4">
            <Graph label={t.paid as string} height="76%" color="bg-primary" />
            <Graph label={t.free as string} height="48%" color="bg-emerald-accent" />
            <Graph label={t.trials as string} height="62%" color="bg-amber-400" />
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <PreviewSignal icon={MailCheck} text="Gmail read-only" />
          <PreviewSignal icon={BellRing} text="Telegram reminders" />
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="rounded-lg border border-outline-variant bg-white p-3"><Icon className="h-4 w-4 text-primary" /><p className="mt-3 text-[10px] font-bold text-on-surface-variant">{label}</p><p className="mt-1 truncate text-[14px] font-extrabold text-[#101828]">{value}</p></div>;
}

function Graph({ color, height, label }: { color: string; height: string; label: string }) {
  return <div className="flex h-full flex-1 flex-col justify-end gap-2"><div className={`w-full rounded-t-md ${color}`} style={{ height }} /><span className="truncate text-center text-[10px] font-bold text-on-surface-variant">{label}</span></div>;
}

function PreviewSignal({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-[11px] font-bold text-on-surface-variant"><Icon className="h-4 w-4 text-primary" />{text}</div>;
}

function PlanCard({ description, features, highlighted = false, label, name, plan, price, secondaryPrice }: { description: string; features: string[]; highlighted?: boolean; label: string; name: string; plan: "free" | "pro_monthly"; price: string; secondaryPrice?: string }) {
  return (
    <article className={`flex flex-col rounded-lg border p-6 shadow-stitch ${highlighted ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-white text-on-surface"}`}>
      <h3 className="text-[22px] font-extrabold">{name}</h3>
      <p className="mt-5 text-[32px] font-extrabold">{price}</p>
      {secondaryPrice ? <p className="mt-1 text-[12px] font-semibold text-on-primary/70">{secondaryPrice}</p> : null}
      <p className={`mt-4 text-[13px] leading-6 ${highlighted ? "text-on-primary/78" : "text-on-surface-variant"}`}>{description}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {features.map((feature) => <li className="flex items-center gap-2 text-[12px] font-bold" key={feature}><span className={`grid h-5 w-5 place-items-center rounded-full ${highlighted ? "bg-white text-primary" : "bg-emerald-soft text-emerald-dark"}`}><Check className="h-3 w-3" /></span>{feature}</li>)}
      </ul>
      <form action={plan === "free" ? "/api/device-mode" : "/api/billing/checkout"} className="mt-8" method="GET">
        {plan === "free" ? <input name="mode" type="hidden" value="desktop" /> : null}
        <input name="plan" type="hidden" value={plan} />
        <button className={`flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[12px] font-extrabold transition-all duration-300 hover:-translate-y-0.5 ${highlighted ? "bg-white text-primary" : "bg-primary text-on-primary"}`} type="submit">{label}<ArrowRight className="h-4 w-4" /></button>
      </form>
    </article>
  );
}
