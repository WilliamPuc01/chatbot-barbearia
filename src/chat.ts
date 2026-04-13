import Anthropic from '@anthropic-ai/sdk'

const systemPrompt = `Você é o assistente virtual da Barbearia do Will.

Informações da barbearia:
- Horário: Segunda a Sábado, 9h às 19h
- Endereço: Rua das Flores, 123 - Campinas/SP
- Serviços e preços:
  - Corte masculino: R$35
  - Barba: R$25
  - Corte + Barba: R$55
  - Hidratação: R$40

Regras:
- Responda sempre em português
- Seja simpático e objetivo
- Se o cliente quiser agendar, peça nome e horário desejado
- Se não souber responder algo, diga que vai verificar com a equipe`

// Histórico em memória por telefone
const historicos = new Map<string, { role: 'user' | 'assistant', content: string }[]>()

export async function chat(telefone: string, mensagem: string): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  // Busca ou cria histórico do número
  if (!historicos.has(telefone)) {
    historicos.set(telefone, [])
  }

  const historico = historicos.get(telefone)!

  // Adiciona mensagem do usuário
  historico.push({ role: 'user', content: mensagem })

  // Chama a IA com o histórico completo
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: historico
  })

  const resposta = response.content[0].type === 'text' ? response.content[0].text : ''

  // Adiciona resposta da IA no histórico
  historico.push({ role: 'assistant', content: resposta })

  // Mantém só as últimas 10 mensagens para não estourar tokens
  if (historico.length > 10) {
    historicos.set(telefone, historico.slice(-10))
  }

  return resposta
}