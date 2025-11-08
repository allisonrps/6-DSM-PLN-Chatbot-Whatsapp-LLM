/**
 * BOT Olimpiadas WhatsApp + LMStudio
 *
 * Dependências:
 * npm install @whiskeysockets/baileys@6.6.0
 * npm install qrcode-terminal
 * npm install pino
 * npm install @hapi/boom
 * npm install axios
 * npm install colors
 */

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const colors = require('colors/safe')

// CONFIGURAÇÕES
const lmstudioUrl = 'http://127.0.0.1:1234'
const conversationHistory = new Map()
const KNOWLEDGE_FOLDER = path.join(__dirname, 'knowledge')
const numerosAutorizados = ['5516992272467']

console.log(colors.cyan.bold('\n🤖 Iniciando Bot Olimpiadas...'))
console.log(colors.yellow(`📱 Números autorizados: ${numerosAutorizados.join(', ')}\n`))

// FUNÇÃO PARA CARREGAR BASE DE CONHECIMENTO
function carregarBaseConhecimento() {
  console.log(colors.cyan('📚 Carregando base de conhecimento...'))
  if (!fs.existsSync(KNOWLEDGE_FOLDER)) {
    fs.mkdirSync(KNOWLEDGE_FOLDER, { recursive: true })
    console.log(colors.yellow('📁 Pasta "knowledge" criada!'))
    return ''
  }

  let conteudoCompleto = ''
  const arquivos = fs.readdirSync(KNOWLEDGE_FOLDER)
  arquivos.forEach(arquivo => {
    if (arquivo.endsWith('.txt') || arquivo.endsWith('.json')) {
      const conteudo = fs.readFileSync(path.join(KNOWLEDGE_FOLDER, arquivo), 'utf-8')
      conteudoCompleto += `\n=== ${arquivo} ===\n${conteudo}\n`
    }
  })

  console.log(colors.green(`✅ ${arquivos.length} arquivos carregados.`))
  return conteudoCompleto
}

const conhecimento = carregarBaseConhecimento()

// CONECTAR AO WHATSAPP
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['LMStudio Bot', 'Chrome', '1.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log(colors.magenta.bold('\n📱 Escaneie este QR code para conectar:\n'))
      qrcode.generate(qr, { small: true }) // QR maior e legível
      console.log(colors.gray('\n⏳ Você tem 60 segundos para escanear.\n'))
    }

    if (connection === 'open') {
      console.log(colors.green.bold('✅ Conectado ao WhatsApp!'))
      axios.get(`${lmstudioUrl}/v1/models`, { timeout: 5000 })
        .then(() => console.log(colors.green('🧠 LMStudio ONLINE!')))
        .catch(() => console.log(colors.red('⚠️ Não foi possível conectar ao LMStudio. Abra manualmente.')))
    } else if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(colors.red.bold(`[WhatsApp] Conexão fechada. Motivo: ${reason}`))
      if (reason !== DisconnectReason.loggedOut) {
        console.log(colors.yellow('🔁 Reconectando...'))
        connectToWhatsApp()
      } else {
        console.log(colors.red('❌ Sessão encerrada. Apague a pasta "auth_info_baileys" e reconecte.'))
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const numero = from.split('@')[0]
    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || ''

    console.log(colors.blue.bold(`\n📩 Mensagem recebida de ${numero}:`), colors.white(texto))

    if (!numerosAutorizados.includes(numero)) {
      console.log(colors.red(`⛔ Número ${numero} não autorizado.`))
      return
    }

    try {
      const online = await axios.get(`${lmstudioUrl}/v1/models`, { timeout: 3000 }).then(() => true).catch(() => false)
      if (!online) {
        await sock.sendMessage(from, { text: colors.red('⚠️ LMStudio não está ativo. Abra e tente novamente.') })
        return
      }

      const historico = conversationHistory.get(from) || []
      let systemMessage = 'Você é um bot que responde em português.'
      if (conhecimento) systemMessage += `\n\nBase de Conhecimento:\n${conhecimento}`

      const mensagensParaIA = [
        { role: 'system', content: systemMessage },
        ...historico,
        { role: 'user', content: texto }
      ]

      const respostaIA = await axios.post(
        `${lmstudioUrl}/v1/chat/completions`,
        { model: 'google/gemma-3n-e4b', messages: mensagensParaIA, temperature: 0.4, max_tokens: 400 },
        { timeout: 30000 }
      )

      const resposta = respostaIA.data.choices[0].message.content
      historico.push({ role: 'user', content: texto })
      historico.push({ role: 'assistant', content: resposta })
      if (historico.length > 20) historico.splice(0, 4)
      conversationHistory.set(from, historico)

      console.log(colors.green.bold('🤖 Bot respondeu:'), colors.white(resposta))
      await sock.sendMessage(from, { text: resposta })

    } catch (erro) {
      console.error(colors.red('❌ Erro ao processar mensagem:'), erro.message)
      await sock.sendMessage(from, { text: 'Ocorreu um erro. Tente novamente mais tarde.' })
    }
  })
}

// INICIAR BOT
connectToWhatsApp()
