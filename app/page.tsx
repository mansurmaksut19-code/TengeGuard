"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BellRing,
  Check,
  CircleDollarSign,
  Landmark,
  Laptop,
  LockKeyhole,
  SearchCheck,
  ShieldCheck,
  Smartphone
} from "lucide-react";

type Locale = "ru" | "en" | "kk";
type DeviceMode = "desktop" | "mobile";

const languages: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  kk: "Қазақша"
};

const copy = {
  ru: {
    how: "Как работает",
    pricing: "Тарифы",
    security: "Безопасность",
    login: "Войти",
    badge: "Защищённый банковский анализ",
    title: "Найдите подписки до следующего списания",
    subtitle: "TengeGuard определяет платные подписки по повторяющимся банковским операциям и заранее предупреждает о следующем платеже.",
    start: "Начать бесплатно",
    startMeta: "14 дней полного доступа",
    pro: "Выбрать Pro",
    proMeta: "от 200 ₸ в месяц",
    desktop: "Ноутбук",
    mobile: "Телефон",
    privacy: "Google используется только для входа. Банковские данные доступны только для чтения.",
    previewTitle: "Обзор подписок",
    previewText: "Подключите банк, чтобы увидеть только ваши реальные регулярные списания.",
    connectBank: "Подключить банк",
    secure: "Salt Edge · доступ только для чтения",
    stepsLabel: "Как это работает",
    stepsTitle: "От подключения до контроля за три шага",
    steps: [
      ["Войдите через Google", "Создайте защищённый аккаунт без доступа TengeGuard к вашим письмам."],
      ["Подключите банк", "Выберите свой банк и разрешите только чтение истории операций."],
      ["Получайте предупреждения", "Telegram сообщит за неделю и за день до прогнозируемого списания."]
    ],
    pricingLabel: "Простые тарифы",
    pricingTitle: "Сначала проверьте бесплатно",
    trial: "Бесплатный период",
    trialPrice: "0 ₸",
    trialText: "Все основные функции на 14 дней.",
    trialFeatures: ["Поиск платных подписок", "Прогноз даты списания", "Доказательства из транзакций"],
    proName: "TengeGuard Pro",
    proPrice: "200 ₸ / месяц",
    proYear: "или 2 000 ₸ в год",
    proText: "Постоянный мониторинг и Telegram-напоминания.",
    proFeatures: ["Всё из бесплатного периода", "Автоматическая синхронизация", "История и помощь с отменой"],
    footer: "Контроль подписок на основе реальных банковских данных"
  },
  en: {
    how: "How it works",
    pricing: "Pricing",
    security: "Security",
    login: "Sign in",
    badge: "Secure bank analysis",
    title: "Find subscriptions before the next charge",
    subtitle: "TengeGuard detects paid subscriptions from recurring bank transactions and warns you before the next expected payment.",
    start: "Start free",
    startMeta: "14 days of full access",
    pro: "Choose Pro",
    proMeta: "from 200 KZT per month",
    desktop: "Desktop",
    mobile: "Phone",
    privacy: "Google is used only for sign-in. Bank data is read-only.",
    previewTitle: "Subscription overview",
    previewText: "Connect your bank to see only your real recurring charges.",
    connectBank: "Connect bank",
    secure: "Salt Edge · read-only access",
    stepsLabel: "How it works",
    stepsTitle: "From connection to control in three steps",
    steps: [
      ["Sign in with Google", "Create a secure account without giving TengeGuard access to your email."],
      ["Connect your bank", "Choose your bank and approve read-only transaction history access."],
      ["Get early warnings", "Telegram alerts you one week and one day before a predicted charge."]
    ],
    pricingLabel: "Simple pricing",
    pricingTitle: "Try everything before paying",
    trial: "Free trial",
    trialPrice: "0 KZT",
    trialText: "All essential features for 14 days.",
    trialFeatures: ["Paid subscription detection", "Next-charge prediction", "Transaction evidence"],
    proName: "TengeGuard Pro",
    proPrice: "200 KZT / month",
    proYear: "or 2,000 KZT per year",
    proText: "Continuous monitoring and Telegram reminders.",
    proFeatures: ["Everything in the free trial", "Automatic synchronization", "History and cancellation help"],
    footer: "Subscription control based on real bank data"
  },
  kk: {
    how: "Қалай жұмыс істейді",
    pricing: "Тарифтер",
    security: "Қауіпсіздік",
    login: "Кіру",
    badge: "Қауіпсіз банк талдауы",
    title: "Келесі төлемге дейін жазылымдарды табыңыз",
    subtitle: "TengeGuard қайталанатын банк операциялары арқылы ақылы жазылымдарды анықтап, келесі төлем туралы алдын ала ескертеді.",
    start: "Тегін бастау",
    startMeta: "14 күн толық қолжетімділік",
    pro: "Pro таңдау",
    proMeta: "айына 200 ₸ бастап",
    desktop: "Ноутбук",
    mobile: "Телефон",
    privacy: "Google тек кіру үшін қолданылады. Банк деректері тек оқуға қолжетімді.",
    previewTitle: "Жазылымдарға шолу",
    previewText: "Тек нақты қайталанатын төлемдерді көру үшін банкті қосыңыз.",
    connectBank: "Банкті қосу",
    secure: "Salt Edge · тек оқуға рұқсат",
    stepsLabel: "Қалай жұмыс істейді",
    stepsTitle: "Қосудан бақылауға дейін үш қадам",
    steps: [
      ["Google арқылы кіріңіз", "TengeGuard-қа хаттарыңызға рұқсат бермей қауіпсіз аккаунт жасаңыз."],
      ["Банкті қосыңыз", "Банкіңізді таңдап, операциялар тарихын тек оқуға рұқсат беріңіз."],
      ["Ескертулер алыңыз", "Telegram болжамды төлемге бір апта және бір күн қалғанда хабарлайды."]
    ],
    pricingLabel: "Қарапайым тарифтер",
    pricingTitle: "Алдымен тегін тексеріңіз",
    trial: "Тегін кезең",
    trialPrice: "0 ₸",
    trialText: "Барлық негізгі функциялар 14 күнге.",
    trialFeatures: ["Ақылы жазылымдарды табу", "Келесі төлемді болжау", "Транзакция дәлелдері"],
    proName: "TengeGuard Pro",
    proPrice: "200 ₸ / ай",
    proYear: "немесе жылына 2 000 ₸",
    proText: "Тұрақты бақылау және Telegram ескертулері.",
    proFeatures: ["Тегін кезеңдегі барлық мүмкіндік", "Автоматты синхрондау", "Тарих және бас тартуға көмек"],
    footer: "Нақты банк деректеріне негізделген жазылым бақылауы"
  }
};

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("ru");
  const [mode, setMode] = useState<DeviceMode>("desktop");
  const t = copy[locale];

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Brand />
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#45464c] md:flex">
            <a href="#how">{t.how}</a>
            <a href="#pricing">{t.pricing}</a>
            <Link href="/security">{t.security}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <select
              aria-label="Language"
              className="h-9 rounded-lg border border-[#e5e7eb] bg-white px-2 text-xs font-semibold outline-none"
              onChange={(event) => setLocale(event.target.value as Locale)}
              value={locale}
            >
              {(Object.keys(languages) as Locale[]).map((item) => <option key={item} value={item}>{languages[item]}</option>)}
            </select>
            <Link className="hidden rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-semibold sm:inline-flex" href="/api/auth/google">{t.login}</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-[#e5e7eb] bg-white px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> {t.badge}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-[42px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[64px]">{t.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#5f6368] sm:text-lg">{t.subtitle}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <form action="/api/device-mode" method="GET">
              <input name="mode" type="hidden" value={mode} />
              <input name="plan" type="hidden" value="free" />
              <button className="flex h-14 w-full items-center justify-between gap-8 rounded-lg bg-black px-5 text-left text-white sm:w-auto" type="submit">
                <span><strong className="block text-sm">{t.start}</strong><span className="text-xs text-white/65">{t.startMeta}</span></span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <form action="/api/billing/checkout" method="GET">
              <input name="plan" type="hidden" value="pro_monthly" />
              <button className="flex h-14 w-full items-center justify-between gap-8 rounded-lg border border-[#d9dadb] bg-white px-5 text-left sm:w-auto" type="submit">
                <span><strong className="block text-sm">{t.pro}</strong><span className="text-xs text-[#6b7280]">{t.proMeta}</span></span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
          <div className="mx-auto mt-5 flex w-fit rounded-lg border border-[#e5e7eb] bg-[#f3f4f5] p-1">
            {([["desktop", Laptop, t.desktop], ["mobile", Smartphone, t.mobile]] as const).map(([value, Icon, label]) => (
              <button className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold ${mode === value ? "bg-white shadow-sm" : "text-[#6b7280]"}`} key={value} onClick={() => setMode(value)} type="button">
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-[#6b7280]"><LockKeyhole className="h-4 w-4" />{t.privacy}</p>
        </div>

        <div className="mx-auto mt-14 max-w-5xl rounded-2xl border border-[#d9dadb] bg-[#f3f4f5] p-3 text-left shadow-float sm:p-5">
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
            <div className="flex h-14 items-center justify-between border-b border-[#e5e7eb] px-5">
              <Brand compact />
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{t.secure}</span>
            </div>
            <div className="grid min-h-[340px] md:grid-cols-[220px_1fr]">
              <div className="hidden border-r border-[#e5e7eb] bg-[#f8f9fa] p-4 md:block">
                {[t.previewTitle, t.pricing, t.security].map((label, index) => <div className={`mb-2 rounded-lg px-3 py-2 text-xs font-semibold ${index === 0 ? "bg-white text-black" : "text-[#76777d]"}`} key={label}>{label}</div>)}
              </div>
              <div className="flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-xl rounded-xl border border-[#e5e7eb] bg-white p-8 text-center shadow-stitch">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f3f4f5]"><Landmark className="h-6 w-6" /></div>
                  <h2 className="mt-5 font-display text-2xl font-semibold">{t.previewTitle}</h2>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6b7280]">{t.previewText}</p>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white"><Landmark className="h-4 w-4" />{t.connectBank}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6" id="how">
        <div className="mx-auto max-w-[1280px]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#76777d]">{t.stepsLabel}</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t.stepsTitle}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[SearchCheck, Landmark, BellRing].map((Icon, index) => (
              <article className="rounded-xl border border-[#e5e7eb] bg-white p-6" key={t.steps[index][0]}>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-black text-white"><Icon className="h-5 w-5" /></div>
                <p className="mt-6 text-xs font-semibold text-[#76777d]">0{index + 1}</p>
                <h3 className="mt-2 font-display text-xl font-semibold">{t.steps[index][0]}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5f6368]">{t.steps[index][1]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e5e7eb] bg-white px-4 py-20 sm:px-6" id="pricing">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#76777d]">{t.pricingLabel}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t.pricingTitle}</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <PricingCard features={t.trialFeatures} name={t.trial} price={t.trialPrice} text={t.trialText} action={t.start} plan="free" />
            <PricingCard dark features={t.proFeatures} name={t.proName} price={t.proPrice} secondary={t.proYear} text={t.proText} action={t.pro} plan="pro_monthly" />
          </div>
        </div>
      </section>

      <footer className="bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 text-xs text-[#6b7280] sm:flex-row sm:items-center sm:justify-between">
          <div><Brand compact /><p className="mt-2">{t.footer}</p></div>
          <div className="flex gap-5"><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link><Link href="/terms">Terms</Link></div>
        </div>
      </footer>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="flex items-center gap-2.5" href="/">
      <span className={`${compact ? "h-8 w-8" : "h-9 w-9"} overflow-hidden rounded-lg border border-[#e5e7eb] bg-white`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="TengeGuard" className="h-full w-full object-cover" src="/tengeguard-mark.jpg" />
      </span>
      <span className="font-display text-base font-bold tracking-[-0.02em]">TengeGuard</span>
    </Link>
  );
}

function PricingCard({ action, dark = false, features, name, plan, price, secondary, text }: { action: string; dark?: boolean; features: string[]; name: string; plan: "free" | "pro_monthly"; price: string; secondary?: string; text: string }) {
  return (
    <article className={`rounded-xl border p-7 ${dark ? "border-black bg-black text-white" : "border-[#e5e7eb] bg-white"}`}>
      <div className="flex items-center justify-between gap-4"><h3 className="font-display text-xl font-semibold">{name}</h3><CircleDollarSign className="h-5 w-5 opacity-60" /></div>
      <p className="mt-7 font-display text-3xl font-semibold">{price}</p>
      {secondary ? <p className="mt-1 text-xs text-white/60">{secondary}</p> : null}
      <p className={`mt-4 text-sm ${dark ? "text-white/65" : "text-[#6b7280]"}`}>{text}</p>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => <li className="flex items-center gap-3 text-sm" key={feature}><Check className="h-4 w-4 text-emerald-500" />{feature}</li>)}
      </ul>
      <form action={plan === "free" ? "/api/device-mode" : "/api/billing/checkout"} className="mt-8" method="GET">
        {plan === "free" ? <input name="mode" type="hidden" value="desktop" /> : null}
        <input name="plan" type="hidden" value={plan} />
        <button className={`flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold ${dark ? "bg-white text-black" : "bg-black text-white"}`} type="submit">{action}<ArrowRight className="h-4 w-4" /></button>
      </form>
    </article>
  );
}
