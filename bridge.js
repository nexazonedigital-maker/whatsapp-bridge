const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const SUPABASE_URL = process.env.SUPABASE_URL;
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const WEBHOOK = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;

const client = new Client({ authStrategy: new LocalAuth() });

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("📱 Scan this QR code with WhatsApp!");
});

client.on("ready", async () => {
  console.log("✅ WhatsApp connected!");
  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-bridge-api-key": BRIDGE_API_KEY },
    body: JSON.stringify({ action: "connected", phone_number: client.info?.wid?.user }),
  });
});

client.on("message", async (msg) => {
  try {
    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bridge-api-key": BRIDGE_API_KEY },
      body: JSON.stringify({
        action: "message",
        from: msg.from,
        message: msg.body,
        pushName: msg._data?.notifyName || "",
      }),
    });
    const data = await res.json();
    if (data.reply) await msg.reply(data.reply);
  } catch (e) { console.error("Error:", e); }
});

client.initialize();
