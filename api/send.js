export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { message } = req.body;
  
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!message || !token || !chatId) {
    return res.status(400).json({ error: 'Faltan datos o credenciales' });
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const telegramRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await telegramRes.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error enviando a Telegram:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}
