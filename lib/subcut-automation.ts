export type BillingCycle = "monthly" | "yearly" | "weekly" | "unknown";
export type SubscriptionStatus = "active" | "cancelled" | "trial" | "review";
export type SubscriptionType = "paid" | "free_trial" | "free" | "unknown";

export interface SubscriptionEvidence {
  source: "gmail" | "bank" | "google_takeout" | "apple_export" | "open_banking";
  message_id?: string;
  subject?: string;
  from?: string;
  date?: string;
  snippet?: string;
  matched_signals: string[];
}

export interface Subscription {
  id: string;
  user_id: string;
  provider_name: string;
  cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_billing_date: string | null;
  status: SubscriptionStatus;
  type: SubscriptionType;
  trial_ends_at?: string | null;
  cancellation_path: string;
  confidence: number;
  evidence: SubscriptionEvidence[];
  last_seen_at: string;
  cancellation_confirmed_at?: string | null;
}

export type ParsedReceipt = Omit<Subscription, "id" | "user_id" | "status" | "last_seen_at"> & {
  status?: SubscriptionStatus;
};

export type EmailReceiptInput = {
  body: string;
  messageId?: string;
  subject?: string;
  from?: string;
  date?: string;
  snippet?: string;
};

type KnownService = {
  name: string;
  aliases: string[];
  domains: string[];
  cancellationPath: string;
};

const serviceCatalog: KnownService[] = [
  { name: "Netflix", aliases: ["Netflix"], domains: ["netflix.com"], cancellationPath: "https://www.netflix.com/cancelplan" },
  { name: "Spotify Premium", aliases: ["Spotify Premium", "Spotify"], domains: ["spotify.com"], cancellationPath: "https://www.spotify.com/account/subscription/" },
  { name: "YouTube Premium", aliases: ["YouTube Premium", "YouTube Music Premium", "YouTube Music"], domains: ["youtube.com"], cancellationPath: "https://www.youtube.com/paid_memberships" },
  { name: "Google One", aliases: ["Google One"], domains: ["one.google.com"], cancellationPath: "https://one.google.com/settings" },
  { name: "Google Workspace", aliases: ["Google Workspace", "Google Admin"], domains: ["workspace.google.com", "admin.google.com"], cancellationPath: "https://admin.google.com/ac/billing/subscriptions" },
  { name: "ChatGPT Plus", aliases: ["ChatGPT Plus", "ChatGPT Pro", "OpenAI", "ChatGPT"], domains: ["openai.com", "chatgpt.com"], cancellationPath: "https://chatgpt.com/#settings/Billing" },
  { name: "Adobe Creative Cloud", aliases: ["Adobe Creative Cloud", "Adobe"], domains: ["adobe.com"], cancellationPath: "https://account.adobe.com/plans" },
  { name: "CapCut Pro", aliases: ["CapCut Pro", "CapCut"], domains: ["capcut.com", "email.capcut.com", "bytedance.com"], cancellationPath: "https://www.capcut.com/settings" },
  { name: "Canva Pro", aliases: ["Canva Pro", "Canva"], domains: ["canva.com"], cancellationPath: "https://www.canva.com/settings/billing-and-plans" },
  { name: "iCloud+", aliases: ["iCloud+", "iCloud"], domains: ["icloud.com"], cancellationPath: "https://support.apple.com/billing" },
  { name: "Apple Music", aliases: ["Apple Music"], domains: ["music.apple.com"], cancellationPath: "https://support.apple.com/billing" },
  { name: "Apple TV+", aliases: ["Apple TV+", "Apple TV"], domains: ["tv.apple.com"], cancellationPath: "https://support.apple.com/billing" },
  { name: "Apple Arcade", aliases: ["Apple Arcade"], domains: ["arcade.apple.com"], cancellationPath: "https://support.apple.com/billing" },
  { name: "Microsoft 365", aliases: ["Microsoft 365", "Office 365"], domains: ["office.com", "microsoft365.com"], cancellationPath: "https://account.microsoft.com/services" },
  { name: "Xbox Game Pass", aliases: ["Xbox Game Pass", "Game Pass"], domains: ["xbox.com"], cancellationPath: "https://account.microsoft.com/services" },
  { name: "Dropbox", aliases: ["Dropbox"], domains: ["dropbox.com"], cancellationPath: "https://www.dropbox.com/account/plan" },
  { name: "Notion", aliases: ["Notion"], domains: ["notion.so"], cancellationPath: "https://www.notion.so/settings/billing" },
  { name: "Figma", aliases: ["Figma"], domains: ["figma.com"], cancellationPath: "https://www.figma.com/settings" },
  { name: "Zoom", aliases: ["Zoom"], domains: ["zoom.us"], cancellationPath: "https://zoom.us/billing" },
  { name: "Discord Nitro", aliases: ["Discord Nitro", "Discord"], domains: ["discord.com"], cancellationPath: "https://discord.com/billing" },
  { name: "Duolingo Super", aliases: ["Duolingo Super", "Super Duolingo", "Duolingo"], domains: ["duolingo.com"], cancellationPath: "https://www.duolingo.com/settings" },
  { name: "Yandex Plus", aliases: ["Yandex Plus", "Яндекс Плюс", "Yandex 360", "Яндекс 360"], domains: ["plus.yandex.ru", "360.yandex.ru"], cancellationPath: "https://passport.yandex.ru/profile/subscriptions" },
  { name: "Kinopoisk", aliases: ["Kinopoisk", "Кинопоиск"], domains: ["kinopoisk.ru"], cancellationPath: "https://passport.yandex.ru/profile/subscriptions" },
  { name: "IVI", aliases: ["IVI", "Иви"], domains: ["ivi.ru"], cancellationPath: "https://www.ivi.ru/profile/subscriptions" },
  { name: "Okko", aliases: ["Okko", "Окко"], domains: ["okko.tv"], cancellationPath: "https://okko.tv/settings/subscriptions" },
  { name: "Amediateka", aliases: ["Amediateka", "Амедиатека"], domains: ["amediateka.ru"], cancellationPath: "https://www.amediateka.ru/account" },
  { name: "START", aliases: ["START", "Start"], domains: ["start.ru"], cancellationPath: "https://start.ru/profile/subscriptions" },
  { name: "KION", aliases: ["KION"], domains: ["kion.ru"], cancellationPath: "https://kion.ru/profile" },
  { name: "Tinder", aliases: ["Tinder", "Tinder Gold", "Tinder Plus"], domains: ["tinder.com"], cancellationPath: "https://www.help.tinder.com/hc/articles/115003554466" },
  { name: "Bumble", aliases: ["Bumble", "Bumble Boost", "Bumble Premium"], domains: ["bumble.com"], cancellationPath: "https://bumble.com/help/how-can-i-cancel-my-bumble-boost-or-bumble-premium-subscription" },
  { name: "Telegram Premium", aliases: ["Telegram Premium", "Telegram"], domains: ["telegram.org"], cancellationPath: "https://telegram.org/faq_premium" },
  { name: "X Premium", aliases: ["X Premium", "Twitter Blue", "Twitter"], domains: ["x.com", "twitter.com"], cancellationPath: "https://help.x.com/using-x/x-premium" },
  { name: "LinkedIn Premium", aliases: ["LinkedIn Premium", "LinkedIn"], domains: ["linkedin.com"], cancellationPath: "https://www.linkedin.com/premium/cancel" },
  { name: "Amazon Prime", aliases: ["Amazon Prime", "Prime Video"], domains: ["primevideo.com"], cancellationPath: "https://www.amazon.com/amazonprime" },
  { name: "Twitch", aliases: ["Twitch", "Twitch Turbo"], domains: ["twitch.tv"], cancellationPath: "https://www.twitch.tv/subscriptions" },
  { name: "Patreon", aliases: ["Patreon"], domains: ["patreon.com"], cancellationPath: "https://www.patreon.com/settings/memberships" },
  { name: "Substack", aliases: ["Substack"], domains: ["substack.com"], cancellationPath: "https://substack.com/settings" },
  { name: "Medium", aliases: ["Medium"], domains: ["medium.com"], cancellationPath: "https://medium.com/me/settings" },
  { name: "GitHub Copilot", aliases: ["GitHub Copilot", "GitHub Pro", "GitHub"], domains: ["github.com"], cancellationPath: "https://github.com/settings/billing" },
  { name: "Flowkey", aliases: ["Flowkey"], domains: ["flowkey.com"], cancellationPath: "https://app.flowkey.com/account" },
  { name: "JetBrains", aliases: ["JetBrains", "IntelliJ IDEA", "PyCharm", "WebStorm"], domains: ["jetbrains.com"], cancellationPath: "https://account.jetbrains.com/licenses" },
  { name: "Vercel", aliases: ["Vercel"], domains: ["vercel.com"], cancellationPath: "https://vercel.com/account/billing" },
  { name: "Grammarly", aliases: ["Grammarly Premium", "Grammarly"], domains: ["grammarly.com"], cancellationPath: "https://account.grammarly.com/subscription" },
  { name: "Coursera Plus", aliases: ["Coursera Plus", "Coursera"], domains: ["coursera.org"], cancellationPath: "https://www.coursera.org/account-settings/subscriptions" },
  { name: "Udemy", aliases: ["Udemy"], domains: ["udemy.com"], cancellationPath: "https://www.udemy.com/user/edit-subscriptions/" },
  { name: "Skillshare", aliases: ["Skillshare"], domains: ["skillshare.com"], cancellationPath: "https://www.skillshare.com/settings/payments" },
  { name: "Headspace", aliases: ["Headspace"], domains: ["headspace.com"], cancellationPath: "https://help.headspace.com/hc/articles/115008916088" },
  { name: "Calm", aliases: ["Calm"], domains: ["calm.com"], cancellationPath: "https://support.calm.com/hc/articles/115002474367" },
  { name: "Strava", aliases: ["Strava"], domains: ["strava.com"], cancellationPath: "https://www.strava.com/settings/account" },
  { name: "NordVPN", aliases: ["NordVPN", "Nord VPN"], domains: ["nordvpn.com"], cancellationPath: "https://my.nordaccount.com/billing" },
  { name: "Surfshark", aliases: ["Surfshark"], domains: ["surfshark.com"], cancellationPath: "https://my.surfshark.com/account/subscription" },
  { name: "ExpressVPN", aliases: ["ExpressVPN", "Express VPN"], domains: ["expressvpn.com"], cancellationPath: "https://www.expressvpn.com/support/manage-account/cancel-subscription/" },
  { name: "Disney+", aliases: ["Disney+", "Disney Plus"], domains: ["disneyplus.com"], cancellationPath: "https://help.disneyplus.com/article/disneyplus-cancel" },
  { name: "Hulu", aliases: ["Hulu"], domains: ["hulu.com"], cancellationPath: "https://secure.hulu.com/account" },
  { name: "Max", aliases: ["HBO Max", "Max"], domains: ["max.com", "hbomax.com"], cancellationPath: "https://help.max.com/subscription" },
  { name: "Paramount+", aliases: ["Paramount+", "Paramount Plus"], domains: ["paramountplus.com"], cancellationPath: "https://www.paramountplus.com/account/" },
  { name: "Deezer", aliases: ["Deezer Premium", "Deezer"], domains: ["deezer.com"], cancellationPath: "https://www.deezer.com/account/subscription" },
  { name: "TIDAL", aliases: ["TIDAL", "Tidal"], domains: ["tidal.com"], cancellationPath: "https://account.tidal.com" },
  { name: "SoundCloud Go", aliases: ["SoundCloud Go", "SoundCloud"], domains: ["soundcloud.com"], cancellationPath: "https://soundcloud.com/settings/subscriptions" },
  { name: "Audible", aliases: ["Audible"], domains: ["audible.com"], cancellationPath: "https://www.audible.com/account/membership" },
  { name: "Kindle Unlimited", aliases: ["Kindle Unlimited"], domains: ["kindle.amazon.com"], cancellationPath: "https://www.amazon.com/kindle-dbs/hz/my-items" },
  { name: "PlayStation Plus", aliases: ["PlayStation Plus", "PS Plus"], domains: ["playstation.com"], cancellationPath: "https://www.playstation.com/support/store/cancel-ps-store-subscription/" },
  { name: "Nintendo Switch Online", aliases: ["Nintendo Switch Online", "Nintendo Online"], domains: ["nintendo.com"], cancellationPath: "https://accounts.nintendo.com/" },
  { name: "EA Play", aliases: ["EA Play"], domains: ["ea.com"], cancellationPath: "https://myaccount.ea.com/cp-ui/subscription/index" },
  { name: "Proton", aliases: ["Proton Unlimited", "Proton Mail", "Proton VPN", "Proton"], domains: ["proton.me"], cancellationPath: "https://account.proton.me/u/0/mail/dashboard" },
  { name: "1Password", aliases: ["1Password"], domains: ["1password.com"], cancellationPath: "https://my.1password.com/billing" },
  { name: "Bitwarden", aliases: ["Bitwarden"], domains: ["bitwarden.com"], cancellationPath: "https://vault.bitwarden.com/#/settings/subscription" },
  { name: "LastPass", aliases: ["LastPass"], domains: ["lastpass.com"], cancellationPath: "https://lastpass.com/my.php" },
  { name: "Todoist", aliases: ["Todoist Pro", "Todoist"], domains: ["todoist.com"], cancellationPath: "https://todoist.com/app/settings/subscription" },
  { name: "Evernote", aliases: ["Evernote"], domains: ["evernote.com"], cancellationPath: "https://www.evernote.com/Settings.action" },
  { name: "Trello", aliases: ["Trello Premium", "Trello"], domains: ["trello.com"], cancellationPath: "https://trello.com/billing" },
  { name: "Slack", aliases: ["Slack"], domains: ["slack.com"], cancellationPath: "https://slack.com/help/articles/218915077" },
  { name: "Miro", aliases: ["Miro"], domains: ["miro.com"], cancellationPath: "https://miro.com/app/settings/billing/" },
  { name: "Loom", aliases: ["Loom"], domains: ["loom.com"], cancellationPath: "https://www.loom.com/settings/billing" },
  { name: "Calendly", aliases: ["Calendly"], domains: ["calendly.com"], cancellationPath: "https://calendly.com/app/billing" },
  { name: "Airtable", aliases: ["Airtable"], domains: ["airtable.com"], cancellationPath: "https://airtable.com/account" },
  { name: "Asana", aliases: ["Asana"], domains: ["asana.com"], cancellationPath: "https://app.asana.com/admin/billing" },
  { name: "ClickUp", aliases: ["ClickUp"], domains: ["clickup.com"], cancellationPath: "https://app.clickup.com/settings/billing" },
  { name: "Monday.com", aliases: ["Monday.com", "Monday"], domains: ["monday.com"], cancellationPath: "https://support.monday.com/hc/articles/360001235445" },
  { name: "Webflow", aliases: ["Webflow"], domains: ["webflow.com"], cancellationPath: "https://webflow.com/dashboard/account/billing" },
  { name: "Wix", aliases: ["Wix"], domains: ["wix.com"], cancellationPath: "https://manage.wix.com/account/premium/subscriptions" },
  { name: "Squarespace", aliases: ["Squarespace"], domains: ["squarespace.com"], cancellationPath: "https://account.squarespace.com/" },
  { name: "Shopify", aliases: ["Shopify"], domains: ["shopify.com"], cancellationPath: "https://admin.shopify.com/settings/plan" },
  { name: "Mailchimp", aliases: ["Mailchimp"], domains: ["mailchimp.com"], cancellationPath: "https://admin.mailchimp.com/account/billing/" },
  { name: "Typeform", aliases: ["Typeform"], domains: ["typeform.com"], cancellationPath: "https://admin.typeform.com/account/plan" },
  { name: "Framer", aliases: ["Framer"], domains: ["framer.com"], cancellationPath: "https://framer.com/projects" },
  { name: "Linear", aliases: ["Linear"], domains: ["linear.app"], cancellationPath: "https://linear.app/settings/workspace/billing" },
  { name: "Replit", aliases: ["Replit Core", "Replit"], domains: ["replit.com"], cancellationPath: "https://replit.com/account#billing" },
  { name: "Cursor", aliases: ["Cursor Pro", "Cursor"], domains: ["cursor.com"], cancellationPath: "https://cursor.com/settings" },
  { name: "CodePen", aliases: ["CodePen Pro", "CodePen"], domains: ["codepen.io"], cancellationPath: "https://codepen.io/accounts/subscription" },
  { name: "Codecademy", aliases: ["Codecademy Pro", "Codecademy"], domains: ["codecademy.com"], cancellationPath: "https://www.codecademy.com/account" },
  { name: "Brilliant", aliases: ["Brilliant Premium", "Brilliant"], domains: ["brilliant.org"], cancellationPath: "https://brilliant.org/account/" },
  { name: "MuseScore", aliases: ["MuseScore PRO+", "MuseScore Pro", "MuseScore"], domains: ["musescore.com", "mail.musescore.com"], cancellationPath: "https://musescore.com/settings/billing" },
  { name: "Claude", aliases: ["Claude Pro", "Claude", "Anthropic"], domains: ["claude.ai", "anthropic.com"], cancellationPath: "https://claude.ai/settings/billing" },
  { name: "Perplexity", aliases: ["Perplexity Pro", "Perplexity"], domains: ["perplexity.ai"], cancellationPath: "https://www.perplexity.ai/settings/subscription" },
  { name: "Midjourney", aliases: ["Midjourney"], domains: ["midjourney.com"], cancellationPath: "https://www.midjourney.com/account" },
  { name: "Runway", aliases: ["Runway", "RunwayML"], domains: ["runwayml.com", "runwayml.cloud"], cancellationPath: "https://app.runwayml.com/settings" },
  { name: "ElevenLabs", aliases: ["ElevenLabs", "Eleven Labs"], domains: ["elevenlabs.io"], cancellationPath: "https://elevenlabs.io/app/subscription" },
  { name: "DeepL", aliases: ["DeepL Pro", "DeepL"], domains: ["deepl.com"], cancellationPath: "https://www.deepl.com/account/plan" },
  { name: "QuillBot", aliases: ["QuillBot Premium", "QuillBot"], domains: ["quillbot.com"], cancellationPath: "https://quillbot.com/account/subscriptions" },
  { name: "Supabase", aliases: ["Supabase"], domains: ["supabase.com"], cancellationPath: "https://supabase.com/dashboard/account/billing" },
  { name: "Firebase", aliases: ["Firebase", "Google Firebase"], domains: ["firebase.google.com"], cancellationPath: "https://console.firebase.google.com/u/0/project/_/usage/details" },
  { name: "Cloudflare", aliases: ["Cloudflare"], domains: ["cloudflare.com"], cancellationPath: "https://dash.cloudflare.com/?to=/:account/billing/subscriptions" },
  { name: "Netlify", aliases: ["Netlify"], domains: ["netlify.com"], cancellationPath: "https://app.netlify.com/user/billing" },
  { name: "Railway", aliases: ["Railway"], domains: ["railway.app"], cancellationPath: "https://railway.app/account/billing" },
  { name: "Render", aliases: ["Render"], domains: ["render.com"], cancellationPath: "https://dashboard.render.com/billing" },
  { name: "DigitalOcean", aliases: ["DigitalOcean", "Digital Ocean"], domains: ["digitalocean.com"], cancellationPath: "https://cloud.digitalocean.com/account/billing" },
  { name: "Heroku", aliases: ["Heroku"], domains: ["heroku.com"], cancellationPath: "https://dashboard.heroku.com/account/billing" },
  { name: "Steam", aliases: ["Steam"], domains: ["steampowered.com", "steamgames.com"], cancellationPath: "https://store.steampowered.com/account/" },
  { name: "Epic Games", aliases: ["Epic Games", "Epic"], domains: ["epicgames.com"], cancellationPath: "https://www.epicgames.com/account/subscriptions" },
  { name: "Roblox", aliases: ["Roblox Premium", "Roblox"], domains: ["roblox.com"], cancellationPath: "https://www.roblox.com/my/account#!/billing" },
  { name: "Riot Games", aliases: ["Riot Games", "Riot"], domains: ["riotgames.com"], cancellationPath: "https://account.riotgames.com/" },
  { name: "Chess.com", aliases: ["Chess.com", "Chess"], domains: ["chess.com"], cancellationPath: "https://www.chess.com/settings/membership" },
  { name: "GoDaddy", aliases: ["GoDaddy"], domains: ["godaddy.com"], cancellationPath: "https://account.godaddy.com/products" },
  { name: "Namecheap", aliases: ["Namecheap"], domains: ["namecheap.com"], cancellationPath: "https://ap.www.namecheap.com/profile/billing" },
  { name: "Porkbun", aliases: ["Porkbun"], domains: ["porkbun.com"], cancellationPath: "https://porkbun.com/account/billing" },
  { name: "Hostinger", aliases: ["Hostinger"], domains: ["hostinger.com"], cancellationPath: "https://hpanel.hostinger.com/billing" },
  { name: "WordPress.com", aliases: ["WordPress.com", "WordPress"], domains: ["wordpress.com"], cancellationPath: "https://wordpress.com/me/purchases" },
  { name: "Ghost", aliases: ["Ghost Pro", "Ghost"], domains: ["ghost.org"], cancellationPath: "https://ghost.org/account/" },
  { name: "Litres", aliases: ["Litres", "Литрес"], domains: ["litres.ru"], cancellationPath: "https://www.litres.ru/pages/my_subscriptions/" },
  { name: "Bookmate", aliases: ["Bookmate", "Букмейт"], domains: ["bookmate.com"], cancellationPath: "https://bookmate.com/profile/settings" },
  { name: "Storytel", aliases: ["Storytel"], domains: ["storytel.com"], cancellationPath: "https://www.storytel.com/account" },
  { name: "PREMIER", aliases: ["PREMIER", "Premier"], domains: ["premier.one"], cancellationPath: "https://premier.one/profile/subscription" },
  { name: "more.tv", aliases: ["more.tv", "More TV"], domains: ["more.tv"], cancellationPath: "https://more.tv/profile" },
  { name: "Wink", aliases: ["Wink"], domains: ["wink.ru"], cancellationPath: "https://wink.ru/profile/subscriptions" },
  { name: "VK Music", aliases: ["VK Music", "VK Музыка", "BOOM"], domains: ["vk.com", "boom.ru"], cancellationPath: "https://vk.com/settings?act=payments" },
  { name: "VK Combo", aliases: ["VK Combo"], domains: ["combo.ru", "vk.com"], cancellationPath: "https://combo.ru/account" },
  { name: "Mail.ru Cloud", aliases: ["Mail.ru Cloud", "Облако Mail.ru"], domains: ["cloud.mail.ru", "mail.ru"], cancellationPath: "https://cloud.mail.ru/account/tariffs" },
  { name: "Kaspersky", aliases: ["Kaspersky", "Kaspersky Plus", "Kaspersky Premium"], domains: ["kaspersky.com"], cancellationPath: "https://my.kaspersky.com/subscriptions" },
  { name: "Dr.Web", aliases: ["Dr.Web", "Doctor Web"], domains: ["drweb.com"], cancellationPath: "https://subscriptions.drweb.com/" },
  { name: "ESET", aliases: ["ESET"], domains: ["eset.com"], cancellationPath: "https://login.eset.com/" },
  { name: "Bitdefender", aliases: ["Bitdefender"], domains: ["bitdefender.com"], cancellationPath: "https://central.bitdefender.com/subscriptions" },
  { name: "Malwarebytes", aliases: ["Malwarebytes"], domains: ["malwarebytes.com"], cancellationPath: "https://my.malwarebytes.com/subscriptions" },
  { name: "Avast", aliases: ["Avast"], domains: ["avast.com"], cancellationPath: "https://id.avast.com/subscriptions" },
  { name: "AVG", aliases: ["AVG"], domains: ["avg.com"], cancellationPath: "https://id.avg.com/subscriptions" },
  { name: "Postman", aliases: ["Postman"], domains: ["postman.com", "getpostman.com"], cancellationPath: "https://go.postman.co/settings/billing" },
  { name: "RapidAPI", aliases: ["RapidAPI", "Rapidapi"], domains: ["rapidapi.com"], cancellationPath: "https://rapidapi.com/developer/billing" },
  { name: "Docker", aliases: ["Docker"], domains: ["docker.com"], cancellationPath: "https://app.docker.com/billing" },
  { name: "GitLab", aliases: ["GitLab"], domains: ["gitlab.com"], cancellationPath: "https://gitlab.com/-/profile/billings" },
  { name: "Atlassian", aliases: ["Atlassian", "Jira", "Confluence", "Trello Premium"], domains: ["atlassian.com", "jira.com"], cancellationPath: "https://admin.atlassian.com/billing" },
  { name: "OpenRouter", aliases: ["OpenRouter"], domains: ["openrouter.ai"], cancellationPath: "https://openrouter.ai/settings/credits" },
  { name: "Replicate", aliases: ["Replicate"], domains: ["replicate.com"], cancellationPath: "https://replicate.com/account/billing" },
  { name: "Paddle", aliases: ["Paddle"], domains: ["paddle.com"], cancellationPath: "https://www.google.com/search?q=manage+Paddle+subscription" },
  { name: "Xsolla", aliases: ["Xsolla"], domains: ["xsolla.com"], cancellationPath: "https://help.xsolla.com/" },
  { name: "FastSpring", aliases: ["FastSpring"], domains: ["fastspring.com"], cancellationPath: "https://fastspring.com/consumer-support/" },
  { name: "Gumroad", aliases: ["Gumroad"], domains: ["gumroad.com"], cancellationPath: "https://gumroad.com/library" },
  { name: "Lemon Squeezy", aliases: ["Lemon Squeezy", "Lemonsqueezy"], domains: ["lemonsqueezy.com"], cancellationPath: "https://app.lemonsqueezy.com/my-orders" },
  { name: "MasterClass", aliases: ["MasterClass"], domains: ["masterclass.com"], cancellationPath: "https://www.masterclass.com/account" }
];

const cancellationPaths = serviceCatalog.reduce<Record<string, string>>((paths, service) => {
  [service.name, ...service.aliases].forEach((name) => {
    paths[normalizeKey(name)] = service.cancellationPath;
  });
  return paths;
}, {});

const symbolCurrency: Record<string, string> = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "₸": "KZT",
  "₽": "RUB"
};

const genericSenderDomains = new Set([
  "paypal.com",
  "stripe.com",
  "squareup.com",
  "paddle.com",
  "chargebee.com",
  "recurly.com",
  "braintreegateway.com",
  "2checkout.com",
  "fastspring.com",
  "google.com",
  "apple.com",
  "microsoft.com",
  "amazon.com",
  "yandex.ru",
  "yandex.kz",
  "yandex.com",
  "sendgrid.net",
  "mailchimp.com",
  "mandrillapp.com",
  "amazonses.com"
]);

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^\wа-яёәғқңөұүһі+]+/gi, " ").replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^[A-Z0-9+]{2,}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanText(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const bodyAliasBlocklist = new Set(["start", "max", "medium", "calm", "linear", "cursor", "brilliant", "monday", "x"]);

function detectServiceName(text: string, subject = "", from = "") {
  const haystack = `${subject}\n${from}\n${text}`;

  const domain = from.match(/@([a-z0-9.-]+)/i)?.[1]?.toLowerCase().replace(/[)>.,;]+$/g, "");
  if (domain) {
    const domainMatch = serviceCatalog.find((service) =>
      service.domains.some((knownDomain) => domain === knownDomain || domain.endsWith(`.${knownDomain}`))
    );
    if (domainMatch) return domainMatch.name;
  }

  const headerText = `${subject}\n${from}`;
  const headerAliasMatch = serviceCatalog
    .flatMap((service) => service.aliases.map((alias) => ({ alias, service })))
    .sort((a, b) => b.alias.length - a.alias.length)
    .find(({ alias }) => new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(headerText));
  if (headerAliasMatch) return headerAliasMatch.service.name;

  const bodyAliasMatch = serviceCatalog
    .flatMap((service) => service.aliases.map((alias) => ({ alias, service })))
    .sort((a, b) => b.alias.length - a.alias.length)
    .find(({ alias }) => {
      const normalizedAlias = normalizeKey(alias);
      const isGenericBodyAlias = bodyAliasBlocklist.has(normalizedAlias) || normalizedAlias.length < 5;
      return !isGenericBodyAlias && new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(text);
    });
  if (bodyAliasMatch) return bodyAliasMatch.service.name;

  const patterns = [
    /(?:your|ваш|сіздің)\s+([a-zа-яё0-9+ ._-]{2,50}?)\s+(?:receipt|invoice|subscription|подписк|чек|шот)/i,
    /([a-zа-яё0-9+ ._-]{2,50}?)\s+(?:subscription|подписк[а-я]*|жазылым)\s+(?:renewed|продлен|renewal|charged|оплачен)/i,
    /(?:thanks for your|спасибо за)\s+([a-zа-яё0-9+ ._-]{2,50}?)\s+(?:subscription|подписк)/i,
    /(?:receipt from|invoice from|чек от|счет от)\s+([a-zа-яё0-9+ ._-]{2,50})/i,
    /(?:paid to|payment to|payment for|merchant|seller|продавец|получатель)\s*:?\s*([a-zа-яё0-9+ ._-]{2,50})/i
  ];

  for (const pattern of patterns) {
    const match = haystack.match(pattern);
    if (match?.[1]) {
      return titleCase(match[1].replace(/subscription|receipt|invoice|подписка|чек|счет/gi, "").trim());
    }
  }

  const domainBrand = domain?.split(".").filter((part) => !["mail", "email", "mailer", "noreply", "no-reply", "accounts", "account", "notifications"].includes(part))[0];
  if (domain && Array.from(genericSenderDomains).some((genericDomain) => domain === genericDomain || domain.endsWith(`.${genericDomain}`))) return "Unknown service";
  return domainBrand ? titleCase(domainBrand) : "Unknown service";
}

function isKnownServiceName(serviceName: string) {
  const key = normalizeKey(serviceName);
  return serviceCatalog.some((service) => [service.name, ...service.aliases].some((name) => normalizeKey(name) === key));
}

function isRejectedNoise(text: string) {
  return /(?:payment (?:failed|unsuccessful)|failed to process|was unsuccessful|insufficient funds|refund(?:ed|s| has been processed| request)|support ticket|how would you rate|rate the support|webinar|digest|newsletter|workflow run|job annotations|deploy to github pages|run failed|invitation from an unknown sender|updated invitation|this event isn't in your calendar|join with google meet|starts in 1 hour|starts in 1 day|starts in 1 week|discover the world|unlock the top|limited time|get \$?\d+ off|get \d+\s+months? of|extend your trial|sign up to|sign up for|try (?:it|for|now)|try (?:a )?free subscription|reward|coupon|gift calendar|loyalty|discount|prize|you won|add stripe|stripe and seo included|pricing ends|current pricing|scheduled for deletion|made any new year|most students submit|olympiads|calendar released|temu|welcome to chess\.com|добро пожаловать на chess\.com|попробовать бесплатн|награда|купон|скидк|приз|календарь подарков|срок действия истекает|вы выиграли|РїРѕРїСЂРѕР±РѕРІР°С‚СЊ Р±РµСЃРїР»Р°С‚РЅ)/i.test(text);
}

function hasPurchaseEvidence(text: string, signals: string[], cost: number, nextBillingDate: string | null) {
  const hasCommercialDocument = signals.includes("receipt") || signals.includes("invoice");
  const hasSuccessfulPayment = /(?:charged|paid|payment (?:received|processed|complete|successful)|оплачено|списано|оплата (?:прошла|получена)|purchase|order)/i.test(text);
  const hasRenewalDate = Boolean(nextBillingDate) && (signals.includes("renewal") || signals.includes("billing_date") || signals.includes("trial"));
  const hasActualTrialEnding = /(?:trial ends|trial ending|trial will end|free trial ends|trial ends tomorrow|триал закончится|пробный период законч)/i.test(text);

  return (
    (hasCommercialDocument && (cost > 0 || hasSuccessfulPayment)) ||
    (cost > 0 && hasSuccessfulPayment) ||
    hasRenewalDate ||
    hasActualTrialEnding
  );
}

function hasFreeOrTrialEvidence(text: string, signals: string[], nextBillingDate: string | null) {
  const looksLikePromotion = /(?:get \d+\s+months? of|extend your trial|sign up to|sign up for|try (?:it|for|now)|offer ends|limited time|start using it today|one step closer)/i.test(text);
  const hasTrialEvidence =
    signals.includes("trial") &&
    !looksLikePromotion &&
    /(?:your (?:free )?trial (?:started|is active|activated|ends|is ending|will end)|(?:free )?trial period (?:started|is active|ends)|пробн.*(?:нач|актив|законч)|триал.*(?:нач|актив|законч))/i.test(text);
  const hasTemporaryFreeEvidence =
    !looksLikePromotion &&
    /(?:free until|free access until|access expires|valid until|complimentary access (?:is active|activated|expires)|бесплатн(?:ый|ая|ое|о) доступ действует|бесплатн(?:ый|ая|ое) период действует|временно бесплатн.*(?:актив|действует)|доступ действует до|действует до|тегін қолжетімділік)/i.test(text);
  const hasFreePlanEvidence =
    signals.includes("free_plan") &&
    /(?:you now have access to [^.]{0,80}free plan|included in your free plan|your free plan is active|free subscription (?:is active|confirmed)|no charge subscription|without charge subscription|бесплатн(?:ый|ая|ое|о|ую) тариф актив|бесплатн(?:ый|ая|ое) план актив|бесплатная подписка актив|тегін жоспар актив)/i.test(text);
  const hasMembershipEvidence =
    signals.includes("membership") &&
    /(?:membership active|subscription confirmed|plan is active|account is active|you are subscribed|подписка активна|подписка подтверждена|тариф активен|жазылым актив)/i.test(text);

  return hasTrialEvidence || hasTemporaryFreeEvidence || hasFreePlanEvidence || hasMembershipEvidence || Boolean(nextBillingDate && signals.includes("trial") && !looksLikePromotion);
}

function hasReviewCandidateEvidence(text: string, signals: string[], type: SubscriptionType) {
  const hardPromotion = /(?:get \$?\d+ off|get \d+\s+months? of|extend your trial|sign up to|sign up for|try (?:it|for|now)|offer ends|limited time|pricing ends|current pricing|start using it today)/i.test(text);
  if (hardPromotion) return false;

  const hasRelevantSignal = signals.some((signal) => ["trial", "free_plan", "membership", "payment", "receipt", "invoice", "billing_date"].includes(signal));
  const hasAccountEvidence = /(?:welcome to|account created|your account is ready|you now have access|your free account|your free plan|free tier|starter plan|basic plan|hobby plan|developer plan|community plan|you are on the free|included in your plan|included in your free plan|free account|free plan|free subscription|subscription confirmed|membership active|plan is active|account is active|you are subscribed|complimentary access|access expires|valid until|trial (?:has )?(?:started|activated|is active|is ending|will end|expires)|добро пожаловать|аккаунт создан|аккаунт готов|доступ открыт|доступ активен|тариф активен|подписка подтверждена|подписка активна|бесплатный тариф|бесплатный план|пробный период|оплата прошла|чек|квитанция|счет|счёт)/i.test(text);

  return hasRelevantSignal && hasAccountEvidence && (type === "free" || type === "free_trial" || type === "unknown");
}

function hasFreeTierEvidence(text: string, signals: string[]) {
  return (
    signals.includes("free_plan") &&
    /(?:free tier|starter plan|basic plan|hobby plan|developer plan|community plan|you are on the free|included in your plan|included in your free plan|free account|free plan|free subscription|you now have access|your account is ready|welcome to)/i.test(text)
  );
}

function hasSubscriptionEvidence(
  text: string,
  signals: string[],
  cost: number,
  nextBillingDate: string | null,
  type: SubscriptionType
) {
  if (type === "free" || type === "free_trial") {
    return hasFreeOrTrialEvidence(text, signals, nextBillingDate) || hasFreeTierEvidence(text, signals);
  }

  return hasPurchaseEvidence(text, signals, cost, nextBillingDate);
}

function detectAmount(text: string) {
  const patterns = [
    /(?:amount|total|charged|paid|payment|renewed for|cost|сумма|итого|оплачено|списано|стоимость)\s*:?\s*([$€£₸₽])?\s*([\d\s.,]+)\s*(USD|EUR|GBP|KZT|RUB|₸|₽|\$|€|£)?/i,
    /([$€£₸₽])\s*([\d\s.,]+)/i,
    /([\d\s.,]+)\s*(USD|EUR|GBP|KZT|RUB|₸|₽)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const groups = match.slice(1).filter(Boolean).map((item) => item.trim());
    const amountRaw = groups.find((item) => /[\d]/.test(item) && !/^(USD|EUR|GBP|KZT|RUB|₸|₽|\$|€|£)$/i.test(item));
    const currencyRaw = groups.find((item) => /^(USD|EUR|GBP|KZT|RUB|₸|₽|\$|€|£)$/i.test(item));
    if (!amountRaw) continue;

    const normalized = amountRaw.replace(/\s/g, "").replace(",", ".");
    const cost = Number(normalized);
    const currency = symbolCurrency[currencyRaw || ""] || String(currencyRaw || "USD").toUpperCase();

    if (Number.isFinite(cost) && cost > 0) {
      return { cost, currency };
    }
  }

  return { cost: 0, currency: "USD" };
}

const monthNameMap: Record<string, number> = {
  january: 0,
  jan: 0,
  февраль: 1,
  февраля: 1,
  фев: 1,
  february: 1,
  feb: 1,
  март: 2,
  марта: 2,
  мар: 2,
  march: 2,
  mar: 2,
  апрель: 3,
  апреля: 3,
  апр: 3,
  april: 3,
  apr: 3,
  май: 4,
  мая: 4,
  may: 4,
  июнь: 5,
  июня: 5,
  июн: 5,
  june: 5,
  jun: 5,
  июль: 6,
  июля: 6,
  июл: 6,
  july: 6,
  jul: 6,
  август: 7,
  августа: 7,
  авг: 7,
  august: 7,
  aug: 7,
  сентябрь: 8,
  сентября: 8,
  сен: 8,
  сент: 8,
  september: 8,
  sep: 8,
  sept: 8,
  октябрь: 9,
  октября: 9,
  окт: 9,
  october: 9,
  oct: 9,
  ноябрь: 10,
  ноября: 10,
  ноя: 10,
  november: 10,
  nov: 10,
  декабрь: 11,
  декабря: 11,
  дек: 11,
  december: 11,
  dec: 11,
  январь: 0,
  января: 0,
  янв: 0
};

const monthNamePattern = Object.keys(monthNameMap)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp)
  .join("|");

function isoFromParts(year: number, monthIndex: number, day: number) {
  if (year < 2000 || year > 2100 || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

function anchorYearFor(monthIndex: number, day: number, anchorDate?: string) {
  const anchor = anchorDate ? new Date(anchorDate) : null;
  if (!anchor || Number.isNaN(anchor.getTime())) return new Date().getUTCFullYear();

  const sameYear = isoFromParts(anchor.getUTCFullYear(), monthIndex, day);
  if (!sameYear) return anchor.getUTCFullYear();

  const parsed = new Date(`${sameYear}T00:00:00.000Z`);
  const thirtyDaysAgo = new Date(anchor);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  return parsed < thirtyDaysAgo ? anchor.getUTCFullYear() + 1 : anchor.getUTCFullYear();
}

function toIsoDate(input: string, anchorDate?: string) {
  const clean = input
    .trim()
    .replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, "$1")
    .replace(/\b(года|год|г\.)\b/gi, "")
    .replace(/[.,;:]$/g, "")
    .replace(/\s+/g, " ");

  const iso = clean.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) return isoFromParts(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const numeric = clean.match(/\b(\d{1,2})[/.](\d{1,2})[/.](20\d{2})\b/);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    const year = Number(numeric[3]);
    const day = second > 12 && first <= 12 ? second : first;
    const month = second > 12 && first <= 12 ? first : second;
    return isoFromParts(year, month - 1, day);
  }

  const dayMonth = clean.match(new RegExp(`\\b(\\d{1,2})\\s+(${monthNamePattern})\\s*,?\\s*(20\\d{2})?\\b`, "i"));
  if (dayMonth?.[1] && dayMonth[2]) {
    const monthIndex = monthNameMap[dayMonth[2].toLowerCase()];
    const day = Number(dayMonth[1]);
    const year = dayMonth[3] ? Number(dayMonth[3]) : anchorYearFor(monthIndex, day, anchorDate);
    return isoFromParts(year, monthIndex, day);
  }

  const monthDay = clean.match(new RegExp(`\\b(${monthNamePattern})\\s+(\\d{1,2})\\s*,?\\s*(20\\d{2})?\\b`, "i"));
  if (monthDay?.[1] && monthDay[2]) {
    const monthIndex = monthNameMap[monthDay[1].toLowerCase()];
    const day = Number(monthDay[2]);
    const year = monthDay[3] ? Number(monthDay[3]) : anchorYearFor(monthIndex, day, anchorDate);
    return isoFromParts(year, monthIndex, day);
  }

  return null;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonths(value: Date, months: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function detectRelativeEndDate(text: string, anchorDate?: string) {
  const anchor = anchorDate ? new Date(anchorDate) : null;
  if (!anchor || Number.isNaN(anchor.getTime())) return null;

  if (/(?:trial|free access|access|period|подписк|триал|доступ|период)[^.\n]{0,100}(?:ends tomorrow|expires tomorrow|завтра законч|заканчивается завтра)|free trial ends tomorrow/i.test(text)) return addDays(anchor, 1);
  if (/(?:trial|free access|access|period|подписк|триал|доступ|период)[^.\n]{0,100}(?:ends today|expires today|сегодня законч|заканчивается сегодня)|free trial ends today/i.test(text)) return addDays(anchor, 0);

  const dayMatch = text.match(/(?:trial|free access|access|period|подписк|триал|доступ|период)[^.\n]{0,100}(?:ends|expires|valid for|for|через|in|на)\s+(\d{1,3})\s+(?:day|days|день|дня|дней|суток)/i);
  if (dayMatch?.[1]) return addDays(anchor, Number(dayMatch[1]));

  const weekMatch = text.match(/(?:trial|free access|access|period|подписк|триал|доступ|период)[^.\n]{0,100}(?:ends|expires|valid for|for|через|in|на)\s+(\d{1,2})\s+(?:week|weeks|неделю|недели|недель)/i);
  if (weekMatch?.[1]) return addDays(anchor, Number(weekMatch[1]) * 7);

  const monthMatch = text.match(/(?:trial|free access|access|period|подписк|триал|доступ|период)[^.\n]{0,100}(?:ends|expires|valid for|for|через|in|на)\s+(\d{1,2})\s+(?:month|months|месяц|месяца|месяцев)/i);
  if (monthMatch?.[1]) return addMonths(anchor, Number(monthMatch[1]));

  return null;
}

function detectBillingPeriodEnd(text: string, anchorDate?: string) {
  const pattern =
    /(?:billing period|service period|subscription period|period covered|current period|период подписки|расчетный период|оплаченный период|период обслуживания)[^.\n]{0,120}?([a-zа-яё0-9, /.-]{3,45})\s(?:-|–|—|to|until|through|до|по)\s([a-zа-яё0-9, /.-]{3,55})/i;
  const match = text.match(pattern);
  if (!match?.[2]) return null;
  return toIsoDate(match[2], anchorDate);
}

function detectExplicitEndDate(text: string, anchorDate?: string) {
  const signalPattern =
    /next renewal date|next renewal|next billing date|next payment|next charge|renews on|renewal date|your plan renews|subscription ends|membership ends|billing date|trial ends|free trial ends|trial expires|free until|free access until|access expires|valid until|expires on|ends on|следующее списание|следующая оплата|следующий платеж|следующий платёж|дата списания|дата продления|дата оплаты|подписка заканчивается|подписка закончится|период заканчивается|пробный период закончится|триал закончится|бесплатный период до|бесплатно до|доступ действует до|действует до/i;
  const matches = Array.from(text.matchAll(new RegExp(signalPattern.source, "gi")));

  for (const match of matches) {
    const start = match.index || 0;
    const segment = text.slice(start, start + 220);
    const relative = detectRelativeEndDate(segment, anchorDate);
    if (relative) return relative;

    const parsed = toIsoDate(segment, anchorDate);
    if (parsed) return parsed;
  }

  return null;
}

function inferNextBillingDate(anchorDate: string | undefined, cycle: BillingCycle, cost: number, text: string) {
  if (!anchorDate || cycle === "unknown" || cost <= 0) return null;
  const anchor = new Date(anchorDate);
  if (Number.isNaN(anchor.getTime())) return null;
  if (!/(receipt|invoice|charged|paid|payment|renewed|оплачено|списано|оплата|чек|счет)/i.test(text)) return null;

  if (cycle === "weekly") return addDays(anchor, 7);
  if (cycle === "monthly") return addMonths(anchor, 1);
  if (cycle === "yearly") return addMonths(anchor, 12);
  return null;
}

function detectNextBillingDate(text: string, anchorDate: string | undefined, cycle: BillingCycle, cost: number) {
  const explicit = detectExplicitEndDate(text, anchorDate) || detectBillingPeriodEnd(text, anchorDate) || detectRelativeEndDate(text, anchorDate);
  if (explicit) return { date: explicit, inferred: false };

  const inferred = inferNextBillingDate(anchorDate, cycle, cost, text);
  return { date: inferred, inferred: Boolean(inferred) };
}

function detectBillingCycle(text: string): BillingCycle {
  if (/годов|ежегод|per year|yearly|annual|annually/i.test(text)) return "yearly";
  if (/недел|per week|weekly/i.test(text)) return "weekly";
  if (/месяц|ежемесяч|ай сайын|per month|monthly/i.test(text)) return "monthly";
  if (/yearly|annual|annually|per year|годов|ежегод/i.test(text)) return "yearly";
  if (/weekly|per week|недел/i.test(text)) return "weekly";
  if (/monthly|per month|month|месяц|ежемесяч|ай сайын/i.test(text)) return "monthly";
  return "unknown";
}

function detectType(text: string, cost: number): SubscriptionType {
  if (/пробн|триал|временно бесплатн|доступ действует до|free trial|trial period|temporary access|free until|valid until/i.test(text)) return "free_trial";
  if (cost > 0 || /чек|квитанц|счет|счёт|оплачено|списано|продлен|продлён|оплата прошла|receipt|invoice|charged|paid|payment|renewed/i.test(text)) return "paid";
  if (/бесплатн(?:ый|ая|ое|о|ую) (?:тариф|план|подписк)|тегін жоспар|подписка активна|тариф активен|free plan|free account|free subscription|no charge|without charge/i.test(text)) return "free";
  if (/free trial|trial (?:started|starts|is active|activated|ends|ending|will end)|trial period|temporary access|temporary free|free access until|free until|access expires|valid until|пробн|триал|временно бесплатн|доступ действует до/i.test(text)) return "free_trial";
  if (cost > 0 || /receipt|invoice|charged|paid|payment|renewed|оплачено|списано|продлен|оплата прошла/i.test(text)) return "paid";
  if (/free plan|free account|free subscription|no charge|without charge|0[.,]00|бесплатн(?:ый|ая|ое|о|ую) (?:тариф|план|подписк)|тегін жоспар|subscription confirmed|membership active|plan is active/i.test(text)) return "free";
  return "unknown";
}

function getCancellationPath(serviceName: string) {
  return cancellationPaths[normalizeKey(serviceName)] || `https://www.google.com/search?q=${encodeURIComponent(`cancel ${serviceName} subscription`)}`;
}

function confidenceScore(input: {
  serviceName: string;
  cost: number;
  nextBillingDate: string | null;
  type: SubscriptionType;
  matchedSignals: string[];
}) {
  let score = 0.2;
  if (input.serviceName !== "Unknown service") score += 0.25;
  if (input.cost > 0) score += 0.25;
  if (input.nextBillingDate) score += 0.2;
  if (input.type !== "unknown") score += 0.1;
  if (input.type === "free_trial" && input.matchedSignals.includes("trial")) score += 0.18;
  if (input.type === "free" && input.matchedSignals.some((signal) => signal === "free_plan" || signal === "membership")) score += 0.15;
  if (input.matchedSignals.length >= 3) score += 0.1;
  return Math.min(0.99, Number(score.toFixed(2)));
}

function matchedSignals(text: string) {
  const signals = [
    ["receipt", /receipt|чек/i],
    ["invoice", /invoice|счет|шот/i],
    ["renewal", /renew(?:al|ed|s)?|продл|next renewal/i],
    ["billing_date", /billing date|next billing|следующее списание|следующая оплата/i],
    ["trial", /free trial|trial (?:started|starts|is active|activated|ends|ending|will end)|trial period|триал|пробн/i],
    ["payment", /charged|paid|payment received|payment processed|payment complete|оплачено|списано|оплата получена|оплата прошла/i],
    ["free_plan", /free plan|free account|free subscription|no charge|without charge|temporary free|free access|бесплатн|тегін/i],
    ["membership", /membership active|subscription confirmed|plan is active|account is active|you are subscribed|подписка активна|подписка подтверждена|тариф активен|жазылым актив/i]
  ] as const;

  return signals.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

export function parseEmailReceipts(input: string | EmailReceiptInput): ParsedReceipt[] {
  const source = typeof input === "string" ? { body: input } : input;
  const body = cleanText(source.body);
  const text = `${source.subject || ""}\n${source.from || ""}\n${body}`;
  const signals: string[] = matchedSignals(text);
  const russianSignals = [
    ["receipt", /чек|квитанц/i],
    ["invoice", /счет|счёт/i],
    ["renewal", /продлен|продлён|продление/i],
    ["billing_date", /следующее списание|следующая оплата|следующий платеж|следующий платёж|дата списания|дата продления/i],
    ["trial", /пробн|триал/i],
    ["payment", /оплачено|списано|оплата получена|оплата прошла/i],
    ["free_plan", /бесплатн|тегін/i],
    ["membership", /подписка активна|подписка подтверждена|тариф активен/i]
  ] as const;
  russianSignals.forEach(([signal, pattern]) => {
    if (pattern.test(text) && !signals.includes(signal)) signals.push(signal);
  });
  if (
    /(?:free tier|starter plan|basic plan|hobby plan|developer plan|community plan|you are on the free|included in your plan)/i.test(text) &&
    !signals.includes("free_plan")
  ) {
    signals.push("free_plan");
  }
  const { cost, currency } = detectAmount(text);
  const type = detectType(text, cost);
  const billing_cycle = detectBillingCycle(text);

  if (signals.length === 0 && type === "unknown") return [];
  if (isRejectedNoise(text)) return [];

  const provider_name = detectServiceName(body, source.subject, source.from);
  const nextBillingDateResult = detectNextBillingDate(text, source.date, billing_cycle, cost);
  const next_billing_date = nextBillingDateResult.date;
  if (nextBillingDateResult.inferred) {
    if (!signals.includes("billing_date")) signals.push("billing_date");
    if (!signals.includes("cycle_estimate")) signals.push("cycle_estimate");
  }
  const trial_ends_at = type === "free_trial" ? next_billing_date : null;
  const confidence = confidenceScore({ serviceName: provider_name, cost, nextBillingDate: next_billing_date, type, matchedSignals: signals });
  const knownService = isKnownServiceName(provider_name);
  const subscriptionEvidence = hasSubscriptionEvidence(text, signals, cost, next_billing_date, type);
  const providerIsIdentified = provider_name !== "Unknown service";
  const softCandidateEvidence = hasReviewCandidateEvidence(text, signals, type);
  const reviewCandidateEvidence =
    (!subscriptionEvidence && knownService && softCandidateEvidence) ||
    (!knownService && providerIsIdentified && (subscriptionEvidence || softCandidateEvidence));
  const finalConfidence = reviewCandidateEvidence ? Math.min(0.64, Math.max(0.55, confidence)) : confidence;
  const status: SubscriptionStatus = reviewCandidateEvidence ? "review" : type === "free_trial" ? "trial" : "active";

  if (!providerIsIdentified || (!knownService && !reviewCandidateEvidence) || (!subscriptionEvidence && !reviewCandidateEvidence) || finalConfidence < 0.5) return [];

  return [
    {
      provider_name,
      cost,
      currency,
      billing_cycle,
      next_billing_date,
      status,
      type,
      trial_ends_at,
      cancellation_path: getCancellationPath(provider_name),
      confidence: finalConfidence,
      evidence: [
        {
          source: "gmail",
          message_id: source.messageId,
          subject: source.subject,
          from: source.from,
          date: source.date,
          snippet: source.snippet,
          matched_signals: signals
        }
      ]
    }
  ];
}
