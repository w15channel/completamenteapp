// api/train.js - API para treinamento da IA
export default async function handler(req, res) {
  // 1. Segurança: Aceita apenas requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // 2. Verificar chave administrativa
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'wr@2026') {
    return res.status(401).json({ error: 'Acesso não autorizado.' });
  }

  try {
    // 3. Receber dados de treinamento
    const trainingData = req.body;
    
    // 4. Validar dados
    if (!trainingData.instruction) {
      return res.status(400).json({ error: 'Instrução de treinamento é obrigatória.' });
    }

    // 5. Salvar treinamento (simulação)
    // Na implementação real, salvaria em banco de dados ou sistema de treinamento
    const trainingRecord = {
      id: Date.now().toString(),
      ...trainingData,
      timestamp: new Date().toISOString(),
      processed: true
    };

    // 6. Aplicar treinamento à IA (simulação)
    // Na implementação real, atualizaria os prompts da IA
    console.log('🧠 Treinamento Recebido:', trainingRecord);

    // 7. Retornar sucesso
    return res.status(200).json({
      success: true,
      message: 'Treinamento aplicado com sucesso',
      id: trainingRecord.id,
      appliedAt: trainingRecord.timestamp
    });

  } catch (error) {
    console.error('Erro no treinamento:', error);
    return res.status(500).json({ 
      error: 'Erro interno ao processar treinamento',
      details: error.message 
    });
  }
}
