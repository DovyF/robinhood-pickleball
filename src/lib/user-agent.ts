/** Lightweight User-Agent parsing — no external dependency, good enough for analytics buckets. */
export function parseUserAgent(ua: string | null | undefined): { device: string; browser: string; os: string } {
  if (!ua) return { device: "Unknown", browser: "Unknown", os: "Unknown" };

  const device = /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";

  let browser = "Other";
  if (/EdgA?\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
  else if (/CriOS\//.test(ua)) browser = "Chrome (iOS)";
  else if (/FxiOS\//.test(ua)) browser = "Firefox (iOS)";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";

  let os = "Other";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { device, browser, os };
}

const BOT_SIGNATURES: [RegExp, string][] = [
  // Social / messaging link-preview crawlers — these fire the instant a link is
  // shared in a chat/DM/post, producing an instant, single-page, 0-second "visit"
  // that has nothing to do with a human clicking through.
  [/facebookexternalhit|Facebot/i, "Facebook/Instagram link preview"],
  [/Twitterbot/i, "Twitter/X link preview"],
  [/Slackbot/i, "Slack link preview"],
  [/TelegramBot/i, "Telegram link preview"],
  [/WhatsApp/i, "WhatsApp link preview"],
  [/LinkedInBot/i, "LinkedIn link preview"],
  [/Discordbot/i, "Discord link preview"],
  [/redditbot/i, "Reddit link preview"],
  [/Pinterest/i, "Pinterest crawler"],
  [/SkypeUriPreview/i, "Skype link preview"],
  [/ViberBot/i, "Viber link preview"],
  // Search engines
  [/Googlebot/i, "Googlebot"],
  [/bingbot/i, "Bingbot"],
  [/DuckDuckBot/i, "DuckDuckGo bot"],
  [/Baiduspider/i, "Baidu bot"],
  [/YandexBot/i, "Yandex bot"],
  [/Applebot/i, "Apple bot"],
  // AI crawlers
  [/GPTBot|ChatGPT-User|OAI-SearchBot/i, "OpenAI crawler"],
  [/ClaudeBot|Claude-Web|anthropic-ai/i, "Anthropic crawler"],
  [/CCBot/i, "Common Crawl bot"],
  [/PerplexityBot/i, "Perplexity crawler"],
  [/Bytespider/i, "ByteDance/TikTok crawler"],
  [/Amazonbot/i, "Amazon bot"],
  // SEO / scraping tools
  [/AhrefsBot/i, "Ahrefs bot"],
  [/SemrushBot/i, "Semrush bot"],
  [/MJ12bot/i, "Majestic bot"],
  [/DotBot/i, "Moz bot"],
  [/PetalBot/i, "Huawei Petal bot"],
  // Uptime / monitoring services
  [/UptimeRobot/i, "UptimeRobot"],
  [/Pingdom/i, "Pingdom"],
  [/StatusCake/i, "StatusCake"],
  [/Site24x7/i, "Site24x7"],
  // Generic scripts / headless browsers
  [/HeadlessChrome|Puppeteer|Playwright|PhantomJS/i, "Headless browser"],
  [/python-requests|python-urllib/i, "Python script"],
  [/^curl\//i, "curl"],
  [/Go-http-client/i, "Go script"],
  [/okhttp/i, "okhttp client"],
  [/PostmanRuntime/i, "Postman"],
  [/axios\//i, "axios client"],
  [/node-fetch/i, "node-fetch"],
];

/** Identify non-human traffic (link-preview crawlers, search bots, scripts, uptime monitors).
 * These skew "0 second, 1 page" session stats and shouldn't count as real visitors. */
export function detectBot(ua: string | null | undefined): { isBot: boolean; botName: string | null } {
  if (!ua) return { isBot: false, botName: null };
  for (const [pattern, name] of BOT_SIGNATURES) {
    if (pattern.test(ua)) return { isBot: true, botName: name };
  }
  if (/bot|crawl|spider|slurp/i.test(ua)) return { isBot: true, botName: "Unidentified bot" };
  return { isBot: false, botName: null };
}
