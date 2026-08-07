import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, CreditCard, ShieldCheck } from "lucide-react";
import { paidPlanDetails, readKaspiPayConfig, readPaymentOrder } from "@/lib/server/payments";

type PageProps = {
  searchParams: Promise<{ order?: string; submitted?: string }>;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0
  }).format(amount);
}

export default async function KaspiPayPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const order = params.order ? await readPaymentOrder(params.order) : null;
  const config = readKaspiPayConfig();
  const cookieStore = await cookies();
  const userId = cookieStore.get("tg_user_id")?.value;

  if (!order || order.provider !== "kaspi_pay" || order.user_id !== userId) {
    return <KaspiShell><Message title="Заказ не найден" text="Вернитесь к тарифам и создайте новый заказ на оплату." /></KaspiShell>;
  }

  const details = paidPlanDetails(order.plan);
  const submitted = params.submitted === "1" || order.status === "awaiting_confirmation";

  return (
    <KaspiShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-stitch sm:p-8">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f6368]" href="/dashboard/account">
            <ArrowLeft className="h-4 w-4" />
            Назад в аккаунт
          </Link>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#76777d]">Kaspi Pay</p>
            <h1 className="mt-3 font-display text-[50px] font-semibold leading-none text-[#191c1d] sm:text-[60px]">
              Оплата TengeGuard Pro
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6b7280]">
              Оплатите тариф через Kaspi Pay. После оплаты заявка попадёт на проверку, и Pro будет включён для вашего аккаунта после подтверждения платежа.
            </p>
          </div>

          {submitted ? (
            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Заявка на оплату отправлена</p>
                  <p className="mt-1 text-sm leading-6">Мы проверим поступление платежа и активируем Pro. Номер заказа: {order.id}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <InfoTile icon={CreditCard} label="Тариф" value={details.label.replace("TengeGuard ", "")} />
            <InfoTile icon={Clock3} label="Срок" value={order.plan === "pro_yearly" ? "1 год" : "1 месяц"} />
            <InfoTile icon={ShieldCheck} label="Сумма" value={formatMoney(order.amount)} />
          </div>

          <div className="mt-8 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] p-5">
            <h2 className="font-display text-[34px] font-semibold leading-none">Как оплатить</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-[#45464c]">
              <li>1. Откройте Kaspi и отправьте оплату получателю ниже.</li>
              <li>2. В комментарии к платежу укажите номер заказа: <strong>{order.id}</strong>.</li>
              <li>3. Нажмите “Я оплатил”, чтобы заявка попала на проверку.</li>
            </ol>
          </div>
        </section>

        <aside className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-stitch">
          <h2 className="font-display text-[34px] font-semibold leading-none">Реквизиты Kaspi</h2>
          {config ? (
            <div className="mt-5 space-y-4">
              <Detail label="Получатель" value={config.merchantName} />
              <Detail label="Kaspi номер" value={config.phone} />
              <Detail label="Сумма" value={formatMoney(order.amount)} />
              <Detail label="Комментарий" value={order.id} mono />
              {config.qrImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Kaspi Pay QR" className="mt-5 w-full rounded-xl border border-[#e5e7eb] bg-white object-contain p-3" src={config.qrImageUrl} />
              ) : null}
              {config.paymentUrl ? (
                <a className="flex w-full items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white" href={config.paymentUrl} rel="noreferrer" target="_blank">
                  Открыть Kaspi Pay
                </a>
              ) : null}
              <form action="/api/billing/kaspi/confirm" method="POST">
                <input name="order" type="hidden" value={order.id} />
                <button className="mt-3 flex w-full items-center justify-center rounded-lg border border-[#d9dadb] bg-white px-5 py-3 text-sm font-semibold" type="submit">
                  Я оплатил
                </button>
              </form>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[#6b7280]">Kaspi Pay реквизиты пока не добавлены в переменные Vercel.</p>
          )}
        </aside>
      </div>
    </KaspiShell>
  );
}

function KaspiShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-8 text-[#191c1d] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px]">
        <Link className="flex items-center gap-2.5" href="/">
          <span className="h-9 w-9 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="TengeGuard" className="h-full w-full object-cover" src="/tengeguard-mark.jpg" />
          </span>
          <span className="font-display text-[30px] font-bold leading-none">TengeGuard</span>
        </Link>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

function Message({ text, title }: { text: string; title: string }) {
  return (
    <section className="rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-stitch">
      <h1 className="font-display text-[42px] font-semibold leading-none">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-[#6b7280]">{text}</p>
      <Link className="mt-6 inline-flex rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white" href="/#pricing">
        Выбрать тариф
      </Link>
    </section>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
      <Icon className="h-5 w-5 text-[#76777d]" />
      <p className="mt-4 text-xs text-[#76777d]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Detail({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="rounded-xl bg-[#f8f9fa] p-4">
      <p className="text-xs text-[#76777d]">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
