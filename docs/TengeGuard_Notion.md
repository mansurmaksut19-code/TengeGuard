# TengeGuard

## Кратко

**TengeGuard** - стартап для автоматического поиска и контроля подписок пользователя.

Сервис подключается к Gmail в режиме read-only, анализирует реальные письма с чеками, оплатами, trial-периодами, бесплатными тарифами и продлениями, а затем показывает пользователю понятный дашборд подписок и отправляет важные уведомления через Telegram-бота.

Главный принцип продукта: **никаких фейковых подписок**. Если система не нашла доказательство, она не должна придумывать сервис, цену или дату.

## Проблема

У пользователей часто есть десятки подписок, trial-периодов и бесплатных тарифов, но они не помнят:

- где активна подписка;
- когда закончится trial;
- когда будет следующее списание;
- где отменить сервис;
- какие подписки уже были отменены;
- какие бесплатные тарифы могут стать платными.

Из-за этого люди теряют деньги, забывают отменять trial и не видят полную картину своих регулярных расходов.

## Решение

TengeGuard собирает подписки автоматически из подтвержденных источников:

- Gmail read-only;
- письма с receipt, invoice, renewal, payment, trial;
- Telegram-уведомления;
- будущие источники: browser extension, open banking, Google Takeout, Apple/Google subscription exports.

Пользователь не должен вручную вводить подписки. Он подключает доступ, а система сама ищет, группирует и объясняет найденные данные.

## Целевая аудитория

- Люди с большим количеством онлайн-сервисов.
- Пользователи, которые часто оформляют trial.
- Студенты, фрилансеры, предприниматели и создатели контента.
- Пользователи СНГ и глобального рынка.
- Люди, которые хотят контролировать расходы без ручного учета.

## Главная ценность

Пользователь получает спокойствие:

- видит подтвержденные подписки;
- понимает, откуда взялась каждая подписка;
- заранее получает уведомления;
- видит дату окончания trial или следующего списания;
- может перейти к отмене конкретной подписки;
- хранит историю текущих и отмененных подписок.

## Что уже есть

### Веб-приложение

- Next.js dashboard.
- Светлый SaaS-дизайн.
- Выбор режима: телефон или ноутбук.
- Отдельные разделы:
  - обзор;
  - подписки;
  - доказательства;
  - доступ;
  - история;
  - ИИ-чат;
  - аккаунт.

### Gmail

- Google OAuth.
- Gmail read-only.
- Сканирование писем.
- Поиск доказательств подписок.
- Фильтрация слабых и рекламных кандидатов.

### Telegram-бот

- Название: **TengeGuard**.
- Подключение через кнопку на сайте.
- Привязка Telegram-чата к аккаунту.
- Команды:
  - `/status`;
  - `/subscriptions`.
- Уведомления о подписках, trial и важных датах.
- Кнопки в сообщениях:
  - открыть отмену;
  - оставить подписку;
  - уже отменил;
  - все подписки.

### История подписок

- Текущие подписки.
- Отмененные подписки.
- Возможность отметить подписку как отмененную.
- Отдельное хранение прошлых подписок.

## Типы подписок

### Платная подписка

Примеры:

- Google One;
- Spotify;
- ChatGPT;
- Yandex Plus;
- Adobe;
- GitHub Copilot.

Поля:

- название сервиса;
- цена;
- валюта;
- цикл оплаты;
- дата следующего списания;
- доказательство;
- ссылка на управление или отмену;
- confidence score.

### Free trial

Примеры:

- `14-day free trial`;
- `trial ends on July 20`;
- `free trial will end tomorrow`.

Важно:

- дата окончания обязательна, если она найдена;
- Telegram должен предупредить заранее;
- trial должен быть отдельной категорией, а не смешиваться с платными подписками.

### Temporary free

Примеры:

- `free for 3 months`;
- `complimentary access until`;
- `доступ действует до`.

Важно:

- показывать как временный бесплатный доступ;
- искать дату окончания;
- уведомлять как trial.

### Free plan

Примеры:

- GitHub Free;
- Notion Free;
- Canva Free;
- Figma Free.

Важно:

- не считать это риском списания, если нет даты или оплаты;
- показывать отдельно от платных подписок;
- не отправлять срочные уведомления без даты.

## Принцип правдивости данных

TengeGuard не должен показывать данные как факт, если нет доказательства.

### Можно показывать как подтвержденную подписку

- Есть Gmail-письмо с оплатой или продлением.
- Есть invoice или receipt.
- Есть чек Google Play, Apple или сервиса.
- Есть явная дата окончания trial.
- Есть письмо, где написано, что план активен.

### Нельзя показывать как подписку

- Просто рекламное письмо.
- `Try free`.
- `Get 3 months`.
- `Offer ends`.
- Welcome email без подтверждения плана.
- Моковые данные.
- Предположения без доказательств.

## Статусы доверия

| Статус | Значение |
|---|---|
| Verified | Есть сильное доказательство |
| Review | Есть слабый кандидат, нужна проверка |
| Missing date | Подписка найдена, но дата окончания не найдена |
| Hidden | Слишком слабый кандидат, не показывать пользователю |

## Раздел "Бесплатные"

Нужно сделать отдельный раздел **Бесплатные**.

| Категория | Что показываем | Telegram |
|---|---|---|
| Free trial | Trial с датой конца | Да |
| Temporary free | Временный бесплатный доступ | Да |
| Free plan | Бесплатный тариф без даты | Нет, только статус |
| Review candidates | Слабые кандидаты | Нет |

Карточка бесплатного тарифа должна показывать:

- сервис;
- тип: free plan / trial / temporary free;
- дата окончания, если есть;
- доказательство;
- уровень доверия;
- кнопка "Открыть сервис";
- кнопка "Это не подписка".

## Desktop extension

Для ноутбуков лучше сделать browser extension.

Зачем:

Gmail не всегда видит все бесплатные тарифы. Многие free plans видны только внутри аккаунта сервиса:

- billing page;
- account settings;
- subscription page;
- pricing page;
- trial banner.

Extension должна:

- видеть текущую страницу пользователя;
- распознавать слова `plan`, `billing`, `subscription`, `free`, `trial`, `renews`, `expires`, `cancel`, `manage plan`;
- определять сервис по домену;
- находить текущий тариф;
- находить дату окончания trial;
- отправлять данные в TengeGuard как доказательство.

## Mobile решение

На телефонах browser extension работает хуже, поэтому mobile-flow должен опираться на:

- PWA;
- Telegram bot;
- Gmail scan;
- push notifications;
- deep links на страницы отмены;
- мобильный режим сайта.

## Roadmap

### Phase 1 - Trust and truth

- [x] Убрать фейковые подписки.
- [x] Показывать только доказанные данные.
- [x] Добавить историю подписок.
- [x] Подключить Telegram-бота.
- [ ] Сделать отдельный раздел "Бесплатные".
- [ ] Улучшить evidence view.
- [ ] Добавить объяснение "почему мы так решили".

### Phase 2 - Free trials

- [ ] Улучшить trial parser.
- [ ] Поддержать русский, английский и казахский текст.
- [ ] Добавить календарь окончания trial.
- [ ] Добавить фильтр `free / trial / paid`.
- [ ] Настроить Telegram-уведомления только для trial с датой.

### Phase 3 - Browser extension

- [ ] Chrome extension MVP.
- [ ] DOM parser для billing-страниц.
- [ ] Кнопка `Save to TengeGuard`.
- [ ] API endpoint для extension.
- [ ] Evidence source: `browser_extension`.

### Phase 4 - Mobile PWA

- [ ] PWA install prompt.
- [ ] Mobile dashboard polish.
- [ ] Telegram onboarding.
- [ ] Push notifications.
- [ ] Deep links на cancellation pages.

### Phase 5 - Open Banking

- [ ] Выбрать провайдера для СНГ и глобального рынка.
- [ ] Получить test/live доступ.
- [ ] Импорт регулярных платежей.
- [ ] Match bank transactions with Gmail evidence.
- [ ] Recurring payment detector.

## Таблица задач

| Задача | Приоритет | Статус | Раздел |
|---|---:|---|---|
| Исправить desktop header | High | Done | Design |
| Убрать фейковые подписки | High | Done | Data |
| Добавить логотип на сайт | High | Done | Brand |
| Сделать раздел "Бесплатные" | High | Todo | Product |
| Улучшить free trial parser | High | Todo | Data |
| Telegram reminders для trial | High | Todo | Telegram |
| Chrome extension MVP | Medium | Todo | Extension |
| PWA mobile notifications | Medium | Todo | Mobile |
| Evidence confidence explanation | High | Todo | Trust |
| Open Banking research | Medium | Todo | Integrations |

## Метрики

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

## Архитектура

### Frontend

- Next.js App Router.
- TypeScript.
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

## Privacy

TengeGuard должен объяснять пользователю:

- Gmail используется только read-only.
- Пароль Gmail не нужен.
- Данные берутся только из писем-доказательств.
- Фейковые подписки не показываются.
- Доступ можно отозвать.
- Telegram получает только итоговые уведомления, не весь Gmail.

## Pitch

**TengeGuard находит реальные подписки и trial-периоды по доказательствам из Gmail и предупреждает в Telegram до списания.**

## One-liner

Контроль подписок без ручного ввода и без фейковых данных.

## Ссылка на GitHub

https://github.com/mansurmaksut19-code/TengeGuard
