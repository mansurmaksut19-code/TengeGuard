# TengeGuard

TengeGuard - веб-сервис для поиска и контроля подписок пользователя.

Проект подключается к Gmail в режиме read-only, анализирует реальные письма с чеками, оплатами, trial-периодами и продлениями, показывает понятный дашборд подписок, историю отмененных сервисов и уведомляет о важных датах через Telegram-бота.

Основная цель - помочь пользователю видеть все платные, бесплатные и пробные подписки в одном месте, заранее узнавать о списаниях и проще управлять регулярными расходами.

## Возможности

- Подключение Gmail через OAuth в режиме только чтения.
- Поиск реальных подписок по письмам, чекам и подтверждениям.
- Разделы дашборда: обзор, подписки, доказательства, доступ, история, ИИ-чат и аккаунт.
- Отображение платных, бесплатных и trial-подписок.
- История текущих и отмененных подписок.
- Telegram-бот для уведомлений о сроках и важных событиях.
- Светлый SaaS-дизайн с адаптацией под телефон и ноутбук.

## Технологии

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Query
- Gmail OAuth
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
