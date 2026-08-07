import type { Subscription } from "@/lib/subcut-automation";

type LocalAssistantInput = {
  question: string;
  subscriptions: Subscription[];
};

function formatDate(value?: string | null) {
  if (!value) return "дата не определена";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString("ru-RU")} ${currency}`;
  }
}

function monthlyCost(subscription: Subscription) {
  if (subscription.billing_cycle === "yearly") return subscription.cost / 12;
  if (subscription.billing_cycle === "weekly") return subscription.cost * 4.345;
  return subscription.cost;
}

function activeSubscriptions(subscriptions: Subscription[]) {
  return subscriptions.filter((subscription) => subscription.status !== "cancelled");
}

function totalsByCurrency(subscriptions: Subscription[]) {
  const totals = new Map<string, number>();
  for (const subscription of subscriptions) {
    const currency = subscription.currency || "KZT";
    totals.set(currency, (totals.get(currency) || 0) + monthlyCost(subscription));
  }
  return Array.from(totals, ([currency, amount]) => formatMoney(amount, currency));
}

function subscriptionLine(subscription: Subscription) {
  const date = subscription.trial_ends_at || subscription.next_billing_date;
  return `${subscription.provider_name}: ${formatMoney(subscription.cost, subscription.currency || "KZT")}, следующее списание — ${formatDate(date)}`;
}

function nearestSubscription(subscriptions: Subscription[]) {
  const now = Date.now();
  return subscriptions
    .filter((subscription) => {
      const date = subscription.trial_ends_at || subscription.next_billing_date;
      return date && new Date(date).getTime() >= now;
    })
    .sort((left, right) => {
      const leftDate = new Date(left.trial_ends_at || left.next_billing_date || 0).getTime();
      const rightDate = new Date(right.trial_ends_at || right.next_billing_date || 0).getTime();
      return leftDate - rightDate;
    })[0];
}

function matchingSubscription(question: string, subscriptions: Subscription[]) {
  const normalized = question.toLowerCase();
  return subscriptions.find((subscription) => normalized.includes(subscription.provider_name.toLowerCase()));
}

export function answerLocally({ question, subscriptions }: LocalAssistantInput) {
  const normalized = question.trim().toLowerCase();
  const active = activeSubscriptions(subscriptions);
  const cancelled = subscriptions.filter((subscription) => subscription.status === "cancelled");
  const matching = matchingSubscription(question, subscriptions);

  if (/^(привет|здравств|сәлем|hello|hi)\b/i.test(normalized)) {
    return "Здравствуйте. Я помогу проверить расходы, даты следующих списаний, активные подписки, отмену и уведомления Telegram. Данные беру только из подтверждённой банковской истории TengeGuard.";
  }

  if (/(что ты умеешь|помощ|help|what can you|не істей)/i.test(normalized)) {
    return "Спросите: «Сколько я трачу в месяц?», «Какое списание следующее?», «Покажи все подписки», «Что скоро спишется?» или «Как отменить подписку?». Я отвечаю по реальным данным вашего аккаунта.";
  }

  if (/(telegram|телеграм|тг|уведомлен|напоминан)/i.test(normalized)) {
    return "Подключите Telegram в дашборде. Бот TengeGuard показывает найденные подписки и предупреждает за 7 дней, за 1 день и в день списания. Команды: /subscriptions, /status, /notifications и /help.";
  }

  if (/(банк|bank|kaspi|каспи|транзакц|операц)/i.test(normalized) && /(подключ|доступ|безопас|read.?only|истори)/i.test(normalized)) {
    return "TengeGuard запрашивает у банковского провайдера только чтение истории операций. Переводы, снятие денег и изменение счёта недоступны. Подписки появляются только после подтверждённых регулярных списаний.";
  }

  if (/(тариф|trial|триал|пробн|pro|цена|стоим)/i.test(normalized)) {
    return "В TengeGuard есть пробный доступ на 14 дней и Pro: 200 ₸ в месяц или 2000 ₸ в год. Состояние вашего тарифа отображается в разделе «Аккаунт».";
  }

  if (/(отмен|законч|отключ|cancel)/i.test(normalized)) {
    if (!active.length) return "Активных подтверждённых подписок для отмены сейчас нет.";
    const target = matching || active.length === 1 ? matching || active[0] : null;
    if (target) {
      return `Для ${target.provider_name} нажмите «Отменить» в разделе подписок или в Telegram. TengeGuard откроет официальный канал сервиса. После подтверждения у сервиса отметьте подписку отменённой, и она перейдёт в историю.`;
    }
    return `Уточните название подписки. Сейчас активны: ${active.slice(0, 8).map((item) => item.provider_name).join(", ")}.`;
  }

  if (/(возврат|верн(?:уть|и|ите|ул|ула|ули|ётся|ется)|спис(?:ал|али|алось|алась|ались|ан|ание)|снял(?:и|о|а)?\s+деньг|деньг.*снял|оспор(?:ить|ю|ьте)|refund|chargeback|charged)/i.test(normalized)) {
    if (matching) {
      return `Чтобы запросить возврат за ${matching.provider_name}, откройте раздел «Подписки», найдите эту подписку и нажмите «Попробовать вернуть». TengeGuard проверит подтверждённое списание и откроет официальный канал возврата сервиса. Окончательное решение принимает продавец или банк.`;
    }

    if (active.length === 1) {
      return `Если речь о ${active[0].provider_name}, откройте раздел «Подписки» и нажмите «Попробовать вернуть» напротив неё. Если списание другое и его ещё нет в TengeGuard, откройте операцию в приложении банка, сохраните название продавца, сумму и дату, сначала запросите возврат у продавца, а при отказе оспорьте операцию через поддержку банка. Никому не сообщайте CVV, PIN или код из SMS.`;
    }

    return "Чтобы вернуть списанные деньги: откройте операцию в приложении банка и проверьте продавца, сумму и дату. Если подписка есть в TengeGuard, в разделе «Подписки» нажмите «Попробовать вернуть». Если её пока нет, сначала запросите возврат у продавца, а при неизвестном или несанкционированном списании сразу заблокируйте карту и оспорьте операцию через поддержку банка. Никому не сообщайте CVV, PIN или код из SMS. Возврат подтверждает продавец или банк, поэтому TengeGuard не может гарантировать его автоматически.";
  }

  if (/(сколько.*(трач|расход|плат)|расход.*месяц|monthly|total|итого)/i.test(normalized)) {
    if (!active.length) return "Подтверждённых активных подписок пока нет, поэтому месячный расход ещё не рассчитан.";
    const totals = totalsByCurrency(active);
    return `Оценка расходов на активные подписки в месяц: ${totals.join(" + ")}. Расчёт основан на ${active.length} подтверждённых подписках.`;
  }

  if (/(следующ|ближайш|скоро|когда.*спиш|next|due)/i.test(normalized)) {
    const nearest = nearestSubscription(active);
    if (!nearest) return "У активных подписок пока нет подтверждённой будущей даты списания.";
    return `Ближайшее списание: ${subscriptionLine(nearest)}.`;
  }

  if (/(покажи|список|все|какие|активн|подписк|subscriptions)/i.test(normalized)) {
    if (!active.length) return "Активные платные подписки пока не найдены. Подключите банк и обновите данные; TengeGuard не добавляет неподтверждённые записи.";
    const lines = active.slice(0, 12).map((subscription, index) => `${index + 1}. ${subscriptionLine(subscription)}`);
    const remainder = active.length > lines.length ? `\nЕщё подписок: ${active.length - lines.length}.` : "";
    return `Активные подписки (${active.length}):\n${lines.join("\n")}${remainder}`;
  }

  if (/(истори|прошл|отменён|отменен|cancelled)/i.test(normalized)) {
    if (!cancelled.length) return "В истории пока нет отменённых подписок.";
    return `Отменённые подписки: ${cancelled.slice(0, 12).map((item) => item.provider_name).join(", ")}.`;
  }

  if (matching) {
    return `По данным TengeGuard: ${subscriptionLine(matching)}. Статус — ${matching.status === "cancelled" ? "отменена" : "активна"}, точность определения — ${Math.round(matching.confidence * 100)}%.`;
  }

  if (active.length) {
    const totals = totalsByCurrency(active).join(" + ");
    const nearest = nearestSubscription(active);
    return [
      `Сейчас у вас ${active.length} активных подтверждённых подписок на сумму около ${totals} в месяц.`,
      nearest ? `Ближайшее списание: ${subscriptionLine(nearest)}.` : "Подтверждённой даты следующего списания пока нет.",
      "Можно уточнить название сервиса или спросить про расходы, дату, отмену либо возврат."
    ].join(" ");
  }

  return "Я не смог определить тему вопроса. По аккаунту активные подтверждённые подписки пока не найдены. Можно спросить про подключение банка, Telegram, тариф, отмену или возврат.";
}
