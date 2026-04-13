import express from 'express'
import dotenv from 'dotenv'
import { chat } from './chat'

dotenv.config()

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Chatbot Barbearia rodando!' })
})

app.post('/chat', async (req, res) => {
  const { telefone, mensagem } = req.body

  if (!telefone || !mensagem) {
    res.status(400).json({ error: 'Campos telefone e mensagem são obrigatórios' })
    return
  }

  const resposta = await chat(telefone, mensagem)
  res.json({ resposta })
})

app.post('/webhook', async (req, res) => {
  try {
    const body = req.body

    // Ignora se não for mensagem de texto
    if (body.event !== 'messages.upsert') {
      res.sendStatus(200)
      return
    }

    const mensagem = body.data?.message
    if (!mensagem) {
      res.sendStatus(200)
      return
    }

    // Ignora mensagens enviadas pelo próprio bot
    if (mensagem.key?.fromMe) {
      res.sendStatus(200)
      return
    }

    // Extrai telefone e texto
    const telefone = mensagem.key?.remoteJid
    const texto = mensagem.message?.conversation || 
                  mensagem.message?.extendedTextMessage?.text

    if (!telefone || !texto) {
      res.sendStatus(200)
      return
    }

    // Gera resposta da IA
    const resposta = await chat(telefone, texto)

    // Envia resposta para o WhatsApp via Evolution API
    await fetch(`${process.env.EVOLUTION_URL}/message/sendText/demo-barbearia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY!
      },
      body: JSON.stringify({
        number: telefone,
        text: resposta
      })
    })

    res.sendStatus(200)

  } catch (error) {
    console.error('Erro no webhook:', error)
    res.sendStatus(500)
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})