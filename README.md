# TengeGuard

TengeGuard - веб-сервис для поиска и контроля платных подписок пользователя.

Проект использует Google только для входа, подключает банк через Salt Edge в режиме read-only, анализирует повторяющиеся транзакции, показывает подтвержденные платные подписки и уведомляет о следующих ожидаемых списаниях через Telegram-бота.

Основная цель - помочь пользователю видеть регулярные платные подписки в одном месте, заранее узнавать о списаниях и проще управлять расходами.

## Возможности

- Регистрация через Google Sign-In без доступа к письмам Gmail.
- Подключение банка через Salt Edge с доступом только к счетам и транзакциям.
- Поиск платных подписок по повторяющимся банковским списаниям.
- Разделы дашборда: обзор, подписки, доказательства, доступ, история, ИИ-чат и аккаунт.
- Прогноз следующей даты списания по реальной истории операций.
- История текущих и отмененных подписок.
- Telegram-бот для уведомлений о сроках и важных событиях.
- Светлый SaaS-дизайн с адаптацией под телефон и ноутбук.

## Технологии

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Query
- Google OAuth
- Salt Edge Open Banking
- Telegram Bot API
- Freedom Pay checkout

## Локальный запуск

```bash
npm install
npm run dev
```

После запуска сайт будет доступен по адресу:

```text
http://localhost:3000
```

## Платные подписки

TengeGuard поддерживает Pro-доступ через Freedom Pay:

- Free Trial: 14 дней.
- Pro monthly: 200 KZT в месяц.
- Pro yearly: 2000 KZT в год.

Деньги приходят не в код сайта, а в личный кабинет/мерчант-аккаунт Freedom Pay. После подключения мерчанта Freedom Pay перечисляет выплаты на банковский счет или карту, указанные в договоре с провайдером.

Для production нужно добавить в Vercel Environment Variables:

```text
FREEDOMPAY_MERCHANT_ID=ваш_merchant_id
FREEDOMPAY_SECRET_KEY=ваш_secret_key
FREEDOMPAY_API_URL=https://api.freedompay.kz
FREEDOMPAY_TESTING_MODE=0
NEXT_PUBLIC_APP_URL=https://www.tengeguard.online
```

## Банковская интеграция

TengeGuard поддерживает банковскую интеграцию через Salt Edge Open Banking. Ключи нельзя хранить в коде или коммитить в GitHub. Их нужно добавлять только в Vercel Environment Variables.

Для production добавьте:

```text
TENGEGUARD_BANK_PROVIDER=saltedge
TENGEGUARD_BANK_PROVIDER_KEY=ваш_Salt_Edge_App_ID
TENGEGUARD_BANK_PROVIDER_SECRET=ваш_Salt_Edge_Secret
TENGEGUARD_BANK_PROVIDER_URL=https://www.saltedge.com/api/v6
NEXT_PUBLIC_APP_URL=https://www.tengeguard.online
```

После сохранения переменных в Vercel нужно сделать `Redeploy`. Только после этого кнопка подключения банка увидит ключи.

Salt Edge также должен перевести приложение из `Pending` в `Test` или `Live`. Наличие App ID и Secret ещё не означает доступ к реальным банкам. В TengeGuard ошибка доступа Salt Edge показывается отдельно от ошибки отсутствующих ключей.

## Постоянное хранилище на Vercel

Файловая система serverless-функций Vercel временная. Для production обязательно подключите Upstash Redis через Vercel Marketplace к проекту TengeGuard. После подключения Vercel должен добавить одну из пар переменных:

```text
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

или:

```text
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

Код автоматически использует Redis для профилей, найденных подписок, банковских подключений и платежных заказов. Локально без Redis остаётся файловое хранилище.

## Google Sign-In

Google Sign-In использует OAuth callback:

```text
https://www.tengeguard.online/api/subcut/gmail/callback
```

Приложение запрашивает только `openid`, `userinfo.email` и `userinfo.profile`. Доступ к Gmail не запрашивается; поиск платных подписок выполняется только по разрешенной банковской истории.
