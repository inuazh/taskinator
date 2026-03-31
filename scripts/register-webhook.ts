// Run: npx tsx scripts/register-webhook.ts
import * as dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const WEBHOOK_URL = "https://taskinator-seven.vercel.app/api/telegram/webhook";

async function main() {
  if (!TOKEN) { console.error("❌ TELEGRAM_BOT_TOKEN not set"); process.exit(1); }
  if (!SECRET) { console.error("❌ TELEGRAM_WEBHOOK_SECRET not set"); process.exit(1); }

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      secret_token: SECRET,
      allowed_updates: ["message"],
    }),
  });

  const data = await res.json();
  if (data.ok) {
    console.log("✅ Webhook registered:", WEBHOOK_URL);
  } else {
    console.error("❌ Failed:", data.description);
  }
}

main();
