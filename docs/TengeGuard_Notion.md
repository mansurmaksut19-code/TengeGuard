# TengeGuard

## 1. Коротко о проекте

**TengeGuard** — сервис, который помогает пользователю находить реальные подписки, trial-периоды и временные бесплатные тарифы по доказательствам из Gmail, а затем предупреждает о списаниях и окончании бесплатных периодов через сайт и Telegram-бота.

Главный принцип продукта: **не показывать фейковые подписки**. Если система не нашла доказательство, она не должна придумывать подписку, цену или дату.

## 2. Видение

TengeGuard должен стать личным центром контроля подписок для пользователей СНГ и дальше глобального рынка.

Пользователь не должен вручную вводить подписки. Он подключает источники данных, а система сама:

- находит подписки;
- определяет платные, бесплатные и trial-тарифы;
- показывает доказательства;
- ищет дату следующего списания или окончания trial;
- отправляет уведомления;
- помогает перейти к отмене подписки.

## 3. Целевая аудитория

- Люди, у которых много сервисов, приложений и trial-периодов.
- Пользователи, которые забывают отменять подписки.
- Студенты, предприниматели, фрилансеры, создатели контента.
- Пользователи СНГ, у которых подписки могут быть в Gmail, Google Play, Apple, банках, Telegram, Yandex, Kaspi, Halyk, Freedom, Tinkoff, YooMoney и других источниках.

## 4. Главная ценность

Пользователь получает спокойствие:

- видит только подтвержденные подписки;
- понимает, откуда система взяла информацию;
- заранее получает уведомление;
- может перейти к отмене;
- не тратит время на ручное добавление.

## 5. Что уже есть

### Сайт

- Светлый SaaS-dashboard.
- Выбор режима: телефон или ноутбук.
- Отдельные страницы:
  - обзор;
  - подписки;
  - доказательства;
  - доступы;
  - история;
  - ИИ-чат;
  - аккаунт.

### Gmail

- Google OAuth.
- Gmail read-only.
- Сканирование писем.
- Поиск реальных доказательств:
  - receipt;
  - invoice;
  - renewal;
  - payment;
  - trial;
  - free plan;
  - membership.

### Telegram-бот

- Подключение через кнопку на сайте.
- Привязка Telegram-чата к аккаунту.
- Команды:
  - `/status`;
  - `/subscriptions`.
- Уведомления о подписках и trial.
- Кнопки:
  - открыть отмену;
  - оставить;
  - уже отменил;
  - все подписки.

### История подписок

- Текущие подписки.
- Отмененные подписки.
- Возможность отметить подписку отмененной.

### Дизайн

- Новый светлый дизайн.
- Логотип TengeGuard.
- SaaS-dashboard стиль.
- Отдельный дизайн для desktop и mobile режимов.

## 6. Принцип правдивости данных

TengeGuard не должен показывать данные как факт, если нет доказательства.

### Разрешено показывать как подтвержденную подписку

- Есть Gmail-письмо с оплатой или продлением.
- Есть чек Google Play / Apple / сервисного провайдера.
- Есть invoice или receipt.
- Есть явная дата окончания trial.
- Есть письмо, где написано, что план активен.

### Нельзя показывать как подписку

- Просто рекламное письмо.
- “Try free”.
- “Get 3 months”.
- “Offer ends”.
- Welcome email без подтверждения плана.
- Любые моковые данные.
- Любые предположения без доказательства.

### Статусы доверия

| Статус | Значение |
|---|---|
| Verified | Есть сильное доказательство |
| Review | Есть слабый кандидат, нужна проверка |
| Missing date | Подписка найдена, но дата окончания не найдена |
| Hidden | Слишком слабый кандидат, не показывать пользователю |

## 7. Типы подписок

### 1. Платная подписка

Пример:

- Google One;
- Spotify;
- ChatGPT;
- Yandex Plus;
- Adobe;
- Netflix;
- GitHub Copilot.

Поля:

- название сервиса;
- цена;
- валюта;
- цикл оплаты;
- дата следующего списания;
- доказательство;
- ссылка на отмену;
- confidence score.

### 2. Free trial

Пример:

- “14-day free trial”;
- “trial ends on July 20”;
- “free trial will end tomorrow”.

Что важно:

- дата окончания обязательна;
- Telegram должен предупредить заранее;
- в интерфейсе это отдельная категория.

### 3. Временный бесплатный доступ

Пример:

- “free for 3 months”;
- “complimentary access until…”;
- “доступ действует до…”.

Что важно:

- показывать как временный бесплатный период;
- искать дату конца;
- уведомлять как trial.

### 4. Free plan без даты конца

Пример:

- GitHub Free;
- Notion Free;
- Canva Free;
- Figma Free.

Что важно:

- не считать это риском списания;
- показывать отдельно от платных подписок;
- не отправлять срочные уведомления, если нет даты.

## 8. Раздел “Бесплатные тарифы”

Нужно сделать отдельный раздел: **Бесплатные**.

### Внутри раздела

| Категория | Что показываем | Telegram |
|---|---|---|
| Free trial | Trial с датой конца | Да |
| Temporary free | Временный бесплатный доступ | Да |
| Free plan | Бесплатный тариф без даты | Нет, только статус |
| Review candidates | Слабые кандидаты | Нет |

### Карточка бесплатного тарифа

Поля:

- сервис;
- тип: free plan / trial / temporary free;
- дата окончания, если есть;
- доказательство;
- уровень доверия;
- кнопка “Открыть сервис”;
- кнопка “Скрыть”;
- кнопка “Это не подписка”.

## 9. Desktop extension

Для ноутбуков лучше сделать browser extension.

### Зачем

Gmail не всегда видит все бесплатные тарифы. Многие free plans видны только внутри аккаунта сервиса, например:

- billing page;
- account settings;
- subscription page;
- pricing page;
- trial banner.

### Что extension должен делать

- Видеть текущую страницу пользователя.
- Распознавать слова:
  - plan;
  - billing;
  - subscription;
  - free;
  - trial;
  - renews;
  - expires;
  - cancel;
  - manage plan.
- Находить название сервиса по домену.
- Находить текущий тариф.
- Находить дату окончания trial.
- Делать screenshot-доказательство или DOM-доказательство.
- Отправлять данные в TengeGuard.

### MVP extension

1. Chrome extension.
2. Кнопка “Save to TengeGuard”.
3. Автоматическое распознавание:
   - service name;
   - plan type;
   - price;
   - billing date;
   - cancel/manage link.
4. Отправка в API TengeGuard.
5. Карточка появляется в dashboard как доказательство “browser extension”.

### Плюсы

- Больше бесплатных тарифов.
- Меньше ручного ввода.
- Лучше дата окончания trial.
- Можно находить подписки, которых нет в Gmail.

### Минусы

- Нужно публиковать в Chrome Web Store.
- Нужно объяснить privacy.
- Нужно не собирать лишние данные.

## 10. Mobile решение

На телефонах расширения работают плохо или почти не работают.

Поэтому для mobile лучше:

- PWA;
- Telegram bot;
- Gmail scan;
- push notifications позже;
- deep links на страницы отмены;
- мобильный режим сайта.

### Mobile flow

1. Пользователь открывает TengeGuard.
2. Выбирает режим телефона.
3. Подключает Gmail.
4. Подключает Telegram.
5. Получает уведомления.
6. Переходит по кнопке на страницу отмены.

### Что добавить позже

- Push notifications.
- “Share to TengeGuard” из email или browser.
- Mobile shortcut.
- Apple/Google Takeout import.

## 11. Roadmap

### Phase 1 — Правда и доверие

Цель: убрать фейк и показывать только доказанные данные.

Задачи:

- [ ] Ужесточить фильтры free plan.
- [ ] Сделать отдельный раздел “Бесплатные”.
- [ ] Добавить label “дата не найдена”.
- [ ] Добавить “почему мы так решили”.
- [ ] Улучшить evidence view.
- [ ] Telegram должен отправлять только подтвержденные данные.

### Phase 2 — Бесплатные тарифы и trial

Цель: находить больше free/trial без ручного ввода.

Задачи:

- [ ] Добавить trial parser v2.
- [ ] Поддержать русский/английский/казахский текст.
- [ ] Добавить отдельные Telegram-шаблоны для trial.
- [ ] Добавить календарь окончаний trial.
- [ ] Добавить фильтр “free / trial / paid”.

### Phase 3 — Browser extension

Цель: находить подписки и free plans внутри аккаунтов.

Задачи:

- [ ] Chrome extension MVP.
- [ ] DOM parser для billing страниц.
- [ ] Кнопка “Save to TengeGuard”.
- [ ] API endpoint для extension.
- [ ] Evidence source: browser_extension.
- [ ] Privacy screen.

### Phase 4 — Mobile PWA

Цель: удобное использование с телефона.

Задачи:

- [ ] PWA install prompt.
- [ ] Mobile dashboard polish.
- [ ] Telegram onboarding.
- [ ] Push notifications.
- [ ] Deep links на cancellation pages.

### Phase 5 — Open Banking

Цель: находить подписки, которых нет в Gmail.

Задачи:

- [ ] Выбрать провайдера для СНГ/глобального рынка.
- [ ] Получить test/live доступ.
- [ ] Импорт регулярных платежей.
- [ ] Match bank transactions with Gmail evidence.
- [ ] Recurring payment detector.

## 12. Таблица задач для Notion

| Задача | Приоритет | Статус | Раздел |
|---|---:|---|---|
| Исправить desktop header | High | Done | Design |
| Убрать фейковые подписки | High | Done | Data |
| Добавить логотип на сайт | High | Done | Brand |
| Сделать раздел “Бесплатные” | High | Todo | Product |
| Улучшить free trial parser | High | Todo | Data |
| Telegram reminders для trial | High | Todo | Telegram |
| Chrome extension MVP | Medium | Todo | Extension |
| PWA mobile notifications | Medium | Todo | Mobile |
| Evidence confidence explanation | High | Todo | Trust |
| Open Banking research | Medium | Todo | Integrations |

## 13. Метрики продукта

### North Star

Количество реально найденных подписок с доказательствами на пользователя.

### Product metrics

- Gmail messages scanned.
- Confirmed subscriptions found.
- Free trials found.
- Trial end dates found.
- Telegram reminders sent.
- Cancellations started.
- False positives hidden.
- User-confirmed correct subscriptions.

### Trust metrics

- % subscriptions with evidence.
- % subscriptions with date.
- % subscriptions marked as fake by user.
- % review candidates promoted to verified.

## 14. Архитектура

### Frontend

- Next.js App Router.
- Tailwind CSS.
- Desktop/mobile modes.
- Dashboard sections.

### Backend

- Next.js API routes.
- Gmail OAuth.
- Telegram Bot API.
- Local JSON storage for prototype.

### Data sources

| Source | Status | Purpose |
|---|---|---|
| Gmail readonly | Active | Receipts, invoices, trial emails |
| Telegram bot | Active | Notifications |
| Browser extension | Planned | Billing pages, free plans |
| Open Banking | Planned | Recurring payments |
| Google Takeout | Planned | Purchases/subscriptions export |
| Apple export | Planned | App Store subscriptions |

## 15. Privacy принцип

TengeGuard должен объяснять пользователю:

- Gmail используется только read-only.
- Пароль Gmail не нужен.
- Данные берутся только из писем-доказательств.
- Фейковые подписки не показываются.
- Доступ можно отозвать.
- Telegram получает только итоговые уведомления, не весь Gmail.

## 16. Позиционирование

### Короткий pitch

**TengeGuard находит реальные подписки и trial-периоды по доказательствам из Gmail и предупреждает в Telegram до списания.**

### One-liner

Контроль подписок без ручного ввода и без фейковых данных.

### Для сайта

Подключите Gmail read-only, и TengeGuard найдет подтвержденные подписки, бесплатные trial-периоды и даты списаний. Telegram-бот предупредит заранее, а dashboard покажет доказательства по каждому сервису.

## 17. Что делать следующим шагом

1. Сделать раздел **Бесплатные**.
2. Разделить free plans, free trials и temporary free.
3. Добавить Telegram-уведомления только для trial/temporary free с датой.
4. Сделать кнопку “Это не подписка”.
5. После этого начинать Chrome extension MVP.

