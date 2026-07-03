export const appContent = {
  metadata: {
    title: "TengeGuard",
    description: "Веб-дашборд для подписок, платежей и честных запросов на возврат."
  },
  brand: {
    name: "TengeGuard",
    kicker: "бережный контроль"
  },
  navigation: {
    dashboard: "Главная",
    subscriptions: "Подписки",
    connect: "Выписка",
    assistant: "Ассистент",
    settings: "Настройки"
  },
  actions: {
    connectStatement: "Подключить выписку",
    notifications: "Уведомления",
    openAssistant: "Открыть чат",
    enableLightTheme: "Включить светлую тему",
    enableDarkTheme: "Включить тёмную тему"
  },
  dashboard: {
    headerLabel: "Веб-дашборд",
    headerTitle: "Подписки под присмотром",
    totalMonthlyLabel: "Пока ожидаем первая выписка",
    emptyState:
      "Загрузи PDF, CSV или скрин из банка один раз, а дальше TengeGuard сам найдёт повторяющиеся платежи и покажет, где можно сэкономить.",
    trustLabel: "Честная автоматизация",
    trustTitle: "Без обещаний, которые техника не держит",
    trustText:
      "Отмена работает автоматически только там, где есть API или разрешённый механизм. Возврат — это запрос в сервис или банк, а не гарантированная кнопка.",
    stats: [
      {
        label: "Найдено автоматически",
        value: "0 подписок",
        help: "Появятся после обработки выписки"
      },
      {
        label: "Годовая нагрузка",
        value: "0 ₸",
        help: "Считаем после первой синхронизации"
      },
      {
        label: "Тема интерфейса",
        value: "Светлая и тёмная",
        help: "Тёмная тема включена по умолчанию"
      }
    ]
  },
  assistant: {
    title: "ИИ-ассистент",
    preview:
      "На следующих шагах здесь появится панель чата: она будет отвечать на вопросы по подпискам, объяснять списания и мягко подсказывать, что можно отменить."
  },
  design: {
    title: "Палитры для TengeGuard",
    description:
      "Основной вариант уже заложен в Tailwind-токены: глубокий синий для доверия и коралловый акцент для экономии.",
    paletteOptions: [
      {
        name: "Trust Coral",
        note: "Текущий вариант: строгая основа и тёплое действие.",
        swatches: [
          { label: "Deep navy", hex: "#173153" },
          { label: "Coral", hex: "#F26D4F" },
          { label: "Mint success", hex: "#20A77A" }
        ]
      },
      {
        name: "Kaspi Warm",
        note: "Чуть ярче и ближе к финансовым сервисам СНГ.",
        swatches: [
          { label: "Ink", hex: "#10243E" },
          { label: "Warm orange", hex: "#FF8A3D" },
          { label: "Sky", hex: "#72B7E8" }
        ]
      },
      {
        name: "Calm Saver",
        note: "Спокойнее для долгой работы с личными расходами.",
        swatches: [
          { label: "Blue black", hex: "#0D2235" },
          { label: "Apricot", hex: "#F6A15B" },
          { label: "Teal", hex: "#2DB9A3" }
        ]
      }
    ]
  }
} as const;
