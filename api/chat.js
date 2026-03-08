export default async function handler(req, res) {
  // 1. Bloqueia qualquer requisição que não seja do tipo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // 2. Pega a mensagem que o seu HTML enviou
  const { mensagem } = req.body;

  try {
    // 3. Faz a chamada para a QWEEN API usando a chave escondida na Vercel
    // Substitua a URL abaixo pela URL real da API que você está utilizando
    const response = await fetch('URL_DA_SUA_API_AQUI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.QWEEN_API_KEY}` 
      },
      body: JSON.stringify({
        prompt: mensagem,
        // Aqui entram as travas de comportamento que estruturamos antes
      })
    });

    const data = await response.json();

    // 4. Devolve a resposta do bot (Dra. Lia, Dr. Marcos, etc) para o seu site
    return res.status(200).json({ resposta: data.choices[0].text }); 

  } catch (error) {
    return res.status(500).json({ error: 'Falha ao conectar com o terapeuta virtual.' });
  }
}
