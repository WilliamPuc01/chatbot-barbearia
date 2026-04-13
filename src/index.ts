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
  console.log('Webhook recebido:', JSON.stringify(req.body))
  try {
    const body = req.body

    if (body.fromMe) {
      console.log('Ignorando mensagem própria')
      res.sendStatus(200)
      return
    }

    const texto = body.text?.message
    const telefone = body.phone

    console.log('Telefone:', telefone, 'Texto:', texto)

    if (!telefone || !texto) {
      console.log('Sem telefone ou texto')
      res.sendStatus(200)
      return
    }

    const resposta = await chat(telefone, texto)
    console.log('Resposta da IA:', resposta)

    const zapiResponse = await fetch(`${process.env.ZAPI_URL}/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: telefone, message: resposta })
    })

    console.log('Z-API status:', zapiResponse.status)
    const zapiBody = await zapiResponse.text()
    console.log('Z-API response:', zapiBody)

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