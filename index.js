/*

 _Este bot foi criado pelo Yota Leviev caso vá usar_

                🌐 Canal 🌐

                ⚙️ REST API ⚙️
                
                 *EM BREVE*
*/


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📦 MÓDULOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason, downloadContentFromMessage } = require('@whiskeysockets/baileys')
const pino = require('pino')
const readline = require('readline')
const https = require('https')

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚙️ CONFIGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

const prefix = '.'

// ⚠️ GERE UMA NOVA CHAVE EM console.groq.com e cole aqui
// A chave antiga foi exposta e provavelmente foi revogada!
const GROQ_API_KEY = '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'

// Respostas fixas — adicione quantas quiser
const respostasFixas = {
    'oi': 'Olá! Como posso te ajudar? 😊',
    'olá': 'Olá! Como posso te ajudar? 😊',
    'ola': 'Olá! Como posso te ajudar? 😊',
    'bom dia': 'Bom dia! ☀️',
    'boa tarde': 'Boa tarde! 🌤️',
    'boa noite': 'Boa noite! 🌙',
    'obrigado': 'De nada! 😄',
    'obrigada': 'De nada! 😄',
    'valeu': 'Disponha! 👍',
    'tudo bem': 'Tudo ótimo por aqui! E você? 😊',
    'tudo bom': 'Tudo ótimo por aqui! E você? 😊',
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎮 DADOS DOS JOGOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

// Jogo da Forca — estado por usuário
const forcaPartidas = {}

const palavrasForca = [
    { palavra: 'javascript', dica: 'Linguagem de programação 💻' },
    { palavra: 'whatsapp', dica: 'Aplicativo de mensagens 📱' },
    { palavra: 'computador', dica: 'Equipamento eletrônico 🖥️' },
    { palavra: 'brasil', dica: 'País da América do Sul 🇧🇷' },
    { palavra: 'futebol', dica: 'Esporte popular ⚽' },
    { palavra: 'internet', dica: 'Rede global de computadores 🌐' },
    { palavra: 'cachorro', dica: 'Animal doméstico 🐶' },
    { palavra: 'pizza', dica: 'Comida italiana 🍕' },
    { palavra: 'musica', dica: 'Arte dos sons 🎵' },
    { palavra: 'viagem', dica: 'Deslocamento para outro lugar ✈️' },
]

// Perguntas de Trivia
const perguntasTrivia = [
    { pergunta: 'Qual é a capital do Brasil?', opcoes: ['A) São Paulo', 'B) Rio de Janeiro', 'C) Brasília', 'D) Salvador'], resposta: 'c', explicacao: 'Brasília é a capital federal desde 1960! 🏛️' },
    { pergunta: 'Quantos lados tem um hexágono?', opcoes: ['A) 5', 'B) 6', 'C) 7', 'D) 8'], resposta: 'b', explicacao: 'Hexágono = 6 lados! 📐' },
    { pergunta: 'Qual planeta é o maior do sistema solar?', opcoes: ['A) Saturno', 'B) Netuno', 'C) Urano', 'D) Júpiter'], resposta: 'd', explicacao: 'Júpiter é o maior planeta do sistema solar! 🪐' },
    { pergunta: 'Em que ano o Brasil foi descoberto?', opcoes: ['A) 1492', 'B) 1500', 'C) 1510', 'D) 1488'], resposta: 'b', explicacao: 'Pedro Álvares Cabral chegou ao Brasil em 1500! ⛵' },
    { pergunta: 'Qual é o elemento químico representado por "O"?', opcoes: ['A) Ouro', 'B) Osmio', 'C) Oxigênio', 'D) Ósmio'], resposta: 'c', explicacao: 'O = Oxigênio, essencial para a vida! 💨' },
    { pergunta: 'Quem pintou a Mona Lisa?', opcoes: ['A) Michelangelo', 'B) Rafael', 'C) Leonardo da Vinci', 'D) Picasso'], resposta: 'c', explicacao: 'Leonardo da Vinci pintou a Mona Lisa! 🖼️' },
    { pergunta: 'Quantos continentes existem no mundo?', opcoes: ['A) 5', 'B) 6', 'C) 7', 'D) 8'], resposta: 'c', explicacao: 'São 7 continentes: África, América, Antártida, Ásia, Europa, Oceania e América do Norte/Sul!' },
    { pergunta: 'Qual é o maior oceano do mundo?', opcoes: ['A) Atlântico', 'B) Índico', 'C) Ártico', 'D) Pacífico'], resposta: 'd', explicacao: 'O Oceano Pacífico é o maior do mundo! 🌊' },
]

// Estado da Trivia por usuário
const triviaPartidas = {}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚒️ FUNCOES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

const esperar = async (tempo) => {
    return new Promise(funcao => setTimeout(funcao, tempo))
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

// Chama a IA Groq para responder
const perguntarClaude = async (pergunta) => {
    return new Promise((resolve) => {
        const body = JSON.stringify({
            model: 'llama3-8b-8192',
            max_tokens: 500,
            messages: [
                {
                    role: 'system',
                    content: 'Você é o LeviBot, um assistente simpático no WhatsApp. Responda de forma curta, amigável e em português. Não use markdown.'
                },
                { role: 'user', content: pergunta }
            ]
        })

        const options = {
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Length': Buffer.byteLength(body)
            }
        }

        const req = https.request(options, (res) => {
            let data = ''
            res.on('data', (chunk) => data += chunk)
            res.on('end', () => {
                try {
                    const json = JSON.parse(data)
                    // Trata erro de API key inválida
                    if (json.error) {
                        console.log('Erro Groq:', json.error.message)
                        resolve('❌ Erro na IA: ' + (json.error.message || 'Chave inválida. Gere uma nova em console.groq.com'))
                        return
                    }
                    resolve(json.choices[0].message.content)
                } catch (e) {
                    console.log('Erro ao parsear resposta Groq:', e)
                    resolve('Não consegui responder agora, tente mais tarde.')
                }
            })
        })

        req.on('error', (e) => {
            console.log('Erro de rede Groq:', e)
            resolve('Erro ao conectar com a IA.')
        })
        req.write(body)
        req.end()
    })
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎮 FUNÇÕES DOS JOGOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Desenhos da forca
const desenhoForca = (erros) => {
    const partes = [
        '  _____\n |     |\n |\n |\n |\n_|_',
        '  _____\n |     |\n |     😵\n |\n |\n_|_',
        '  _____\n |     |\n |     😵\n |     |\n |\n_|_',
        '  _____\n |     |\n |     😵\n |    /|\n |\n_|_',
        '  _____\n |     |\n |     😵\n |    /|\\\n |\n_|_',
        '  _____\n |     |\n |     😵\n |    /|\\\n |    /\n_|_',
        '  _____\n |     |\n |     😵\n |    /|\\\n |    / \\\n_|_',
    ]
    return partes[Math.min(erros, 6)]
}

const mostrarForca = (partida) => {
    const palavraExibida = partida.palavra
        .split('')
        .map(l => partida.letrasCorretas.has(l) ? l : '_')
        .join(' ')

    return `${desenhoForca(partida.erros)}\n\n` +
        `📝 Palavra: ${palavraExibida}\n` +
        `💡 Dica: ${partida.dica}\n` +
        `❌ Erros: ${partida.erros}/6\n` +
        `🔤 Letras erradas: ${[...partida.letrasErradas].join(', ') || 'nenhuma'}\n\n` +
        `Digite uma letra para jogar!`
}

const iniciarForca = (userId) => {
    const sorteada = palavrasForca[Math.floor(Math.random() * palavrasForca.length)]
    forcaPartidas[userId] = {
        palavra: sorteada.palavra,
        dica: sorteada.dica,
        letrasCorretas: new Set(),
        letrasErradas: new Set(),
        erros: 0,
        ativa: true
    }
    return forcaPartidas[userId]
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 BOT E CONEXÃO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function ligarbot() {

    let jaPareou = false

    const { state, saveCreds } = await useMultiFileAuthState('./sessao')
    const { version } = await fetchLatestBaileysVersion()

    const client = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        printQRInTerminal: false
    })

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ♻️ DADOS DA CONEXÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

client.ev.on('creds.update', saveCreds)

client.ev.on('chats.set', () => {
    console.log('setando conversas...')
})

client.ev.on('contacts.set', () => {
    console.log('setando contatos...')
})

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📧 MENSAGENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

client.ev.on('messages.upsert', async ({ messages }) => {
try {

const msgInfo = messages[0]
if (!msgInfo.message) return
if (msgInfo.key.fromMe) return

const key = {
    remoteJid: msgInfo.key.remoteJid,
    id: msgInfo.key.id,
    participant: msgInfo.key.participant
}
await client.readMessages([key])
if (msgInfo.key && msgInfo.key.remoteJid == 'status@broadcast') return

const altpdf = Object.keys(msgInfo.message)
const type = altpdf[0] == 'senderKeyDistributionMessage' ? altpdf[1] == 'messageContextInfo' ? altpdf[2] : altpdf[1] : altpdf[0]

const body = (type === 'conversation') ?
msgInfo.message.conversation : (type == 'imageMessage') ?
(msgInfo.message.imageMessage.caption || '') : (type == 'videoMessage') ?
(msgInfo.message.videoMessage.caption || '') : (type == 'extendedTextMessage') ?
msgInfo.message.extendedTextMessage.text : (type == 'buttonsResponseMessage') ?
msgInfo.message.buttonsResponseMessage.selectedButtonId : (msgInfo.message.listResponseMessage && msgInfo.message.listResponseMessage.singleSelectReply.selectedRowId.startsWith(prefix) && msgInfo.message.listResponseMessage.singleSelectReply.selectedRowId) ? msgInfo.message.listResponseMessage.singleSelectReply.selectedRowId : (type == 'templateButtonReplyMessage') ?
msgInfo.message.templateButtonReplyMessage.selectedId : (type === 'messageContextInfo') ? (msgInfo.message.buttonsResponseMessage?.selectedButtonId || msgInfo.message.listResponseMessage?.singleSelectReply.selectedRowId || msgInfo.text || '') : ''

const from = msgInfo.key.remoteJid
const isGrupo = from.endsWith('@g.us')
const remetente = isGrupo ? msgInfo.key.participant : msgInfo.key.remoteJid
const isCmd = body && body.startsWith(prefix)
const comando = isCmd ? body.slice(1).trim().split(/ +/).shift().toLocaleLowerCase() : null
const separar = body ? body.trim().split(/ +/).slice(1) : []
const args = separar.join(' ')

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔰 FUNÇÕES DO BOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

async function escrever(texto) {
    await client.sendPresenceUpdate('composing', from)
    await esperar(1000)
    await client.sendMessage(from, { text: texto }, { quoted: msgInfo })
}

const enviar = (texto) => {
    client.sendMessage(from, { text: texto }, { quoted: msgInfo })
}

// Verifica se o remetente é admin do grupo
const isAdmin = async () => {
    if (!isGrupo) return true
    try {
        const meta = await client.groupMetadata(from)
        const admins = meta.participants.filter(p => p.admin).map(p => p.id)
        return admins.includes(remetente)
    } catch {
        return false
    }
}

// Pega o número mencionado ou respondido
const getMencao = () => {
    const mencao = msgInfo.message?.extendedTextMessage?.contextInfo?.mentionedJid
    if (mencao && mencao.length > 0) return mencao[0]
    const quoted = msgInfo.message?.extendedTextMessage?.contextInfo?.participant
    if (quoted) return quoted
    return null
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎮 LÓGICA DOS JOGOS (sem comando)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

// Verifica se está jogando forca
if (!isCmd && forcaPartidas[remetente]?.ativa) {
    const partida = forcaPartidas[remetente]
    const letra = body.trim().toLowerCase()

    if (letra.length === 1 && /[a-záéíóúãõâêîôûç]/.test(letra)) {
        if (partida.letrasCorretas.has(letra) || partida.letrasErradas.has(letra)) {
            enviar(`⚠️ Você já tentou a letra *${letra.toUpperCase()}*! Tente outra.`)
            return
        }

        if (partida.palavra.includes(letra)) {
            partida.letrasCorretas.add(letra)
            const venceu = partida.palavra.split('').every(l => partida.letrasCorretas.has(l))
            if (venceu) {
                partida.ativa = false
                delete forcaPartidas[remetente]
                await escrever(`✅ PARABÉNS! Você acertou!\n\n🎉 A palavra era: *${partida.palavra.toUpperCase()}*\n\nUse *!forca* para jogar de novo!`)
            } else {
                await escrever(`✅ Letra *${letra.toUpperCase()}* está na palavra!\n\n${mostrarForca(partida)}`)
            }
        } else {
            partida.letrasErradas.add(letra)
            partida.erros++
            if (partida.erros >= 6) {
                partida.ativa = false
                delete forcaPartidas[remetente]
                await escrever(`💀 GAME OVER! Você perdeu!\n\n😔 A palavra era: *${partida.palavra.toUpperCase()}*\n\nUse *!forca* para jogar de novo!`)
            } else {
                await escrever(`❌ Letra *${letra.toUpperCase()}* não está na palavra!\n\n${mostrarForca(partida)}`)
            }
        }
        return
    }
}

// Verifica se está jogando trivia
if (!isCmd && triviaPartidas[remetente]?.ativa) {
    const partida = triviaPartidas[remetente]
    const resp = body.trim().toLowerCase()

    if (['a', 'b', 'c', 'd'].includes(resp)) {
        if (resp === partida.resposta) {
            partida.acertos++
            await escrever(`✅ CORRETO! ${partida.explicacao}\n\n🏆 Acertos: ${partida.acertos} | ❌ Erros: ${partida.erros}\n\nPróxima pergunta em 2 segundos...`)
        } else {
            partida.erros++
            await escrever(`❌ ERRADO! A resposta certa era *${partida.resposta.toUpperCase()}*\n\n${partida.explicacao}\n\n🏆 Acertos: ${partida.acertos} | ❌ Erros: ${partida.erros}\n\nPróxima pergunta em 2 segundos...`)
        }

        partida.indice++
        if (partida.indice >= partida.perguntas.length) {
            triviaPartidas[remetente].ativa = false
            delete triviaPartidas[remetente]
            await esperar(2000)
            const nota = partida.acertos >= 6 ? '🥇 Excelente!' : partida.acertos >= 4 ? '🥈 Bom!' : '🥉 Continue praticando!'
            await escrever(`🎯 FIM DO QUIZ!\n\n✅ Acertos: ${partida.acertos}\n❌ Erros: ${partida.erros}\n\n${nota}\n\nUse *!trivia* para jogar de novo!`)
        } else {
            await esperar(2000)
            const prox = partida.perguntas[partida.indice]
            await escrever(`❓ Pergunta ${partida.indice + 1}/${partida.perguntas.length}:\n\n*${prox.pergunta}*\n\n${prox.opcoes.join('\n')}\n\nResponda com A, B, C ou D`)
        }
        return
    }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎮 COMANDOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

if (isCmd) {
switch(comando) {

case 'escrever':
    await escrever('ola, estou escrevendo como humano')
    break

case 'responda':
    enviar('ola')
    break

case 'menu': {
    const menu = `
╔═══════════════════╗
   🤖 𝙇𝙀𝙑𝙄 𝘽𝙊𝙏 🤖
╚═══════════════════╝

✨ 𝙈𝙀𝙉𝙐 𝘿𝙀 𝘾𝙊𝙈𝘼𝙉𝘿𝙊𝙎 ✨

📌 ┃ INFORMAÇÕES
┃ ➤ ${prefix}menu
┃ ➤ ${prefix}ping
┃ ➤ ${prefix}info
┃ ➤ ${prefix}dono

🖼️ ┃ MÍDIA
┃ ➤ ${prefix}sticker

👥 ┃ GRUPO (só admins)
┃ ➤ ${prefix}ban @user
┃ ➤ ${prefix}kick @user
┃ ➤ ${prefix}todos
┃ ➤ ${prefix}link
┃ ➤ ${prefix}apagar

🤖 ┃ IA
┃ ➤ ${prefix}ia (sua pergunta)
┃ ➤ Fale normalmente comigo!

🎮 ┃ JOGOS
┃ ➤ ${prefix}dado — Rola um dado 🎲
┃ ➤ ${prefix}jokempo — Pedra/Papel/Tesoura ✊
┃ ➤ ${prefix}forca — Jogo da Forca 🪢
┃ ➤ ${prefix}trivia — Quiz de perguntas ❓

════════════════
📌 Prefixo: ${prefix}
👨‍💻 Criador: Yota Leviev
⚡ Versão: 0.3
════════════════
`
    await escrever(menu)
}
break

case 'ping':
    enviar('🏓 Pong')
    break

case 'info': {
    const infoMsg = `
╔═ 🤖 INFO BOT 🤖 ══╗
║
║ 🤖 Nome: LeviBot
║ ⚡ Versão: 0.3
║ 👨‍💻 Criador: Yota Leviev
║ 🧠 Linguagem: Node.js
║ 📦 Biblioteca: Baileys
║ 🤖 IA: Groq (Llama 3)
║ 📆 Criado em: 2026
║
║ "Automatizando seu grupo ⚡"
║
╚═══════════════╝
`
    await escrever(infoMsg)
}
break

case 'dono': {
    const dono = `
╔═ 👑 DONO DO BOT 👑 ══╗
║
║ 👑 Nome: Yota Leviev
║ 💻 Função: Desenvolvedor
║
║ "Criador da máquina 🤖⚡"
║
╚══════════════════╝
`
    await escrever(dono)
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ STICKER
// ━━━━━━━━━━━━━━━━━━━━━━
case 'sticker': {
    const quoted = msgInfo.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const imgMsg = quoted?.imageMessage || msgInfo.message?.imageMessage
    const vidMsg = quoted?.videoMessage || msgInfo.message?.videoMessage

    if (!imgMsg && !vidMsg) {
        enviar('❌ Envie ou responda uma imagem/vídeo com !sticker')
        break
    }

    try {
        if (imgMsg) {
            const stream = await downloadContentFromMessage(imgMsg, 'image')
            let buffer = Buffer.from([])
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
            await client.sendMessage(from, { sticker: buffer }, { quoted: msgInfo })
        } else {
            enviar('⚠️ Para vídeo como sticker, use um app como o Sticker.ly por enquanto.')
        }
    } catch {
        enviar('❌ Erro ao criar figurinha.')
    }
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// 🔨 BAN (remove do grupo)
// ━━━━━━━━━━━━━━━━━━━━━━
case 'ban': {
    if (!isGrupo) { enviar('❌ Apenas em grupos!'); break }
    if (!(await isAdmin())) { enviar('❌ Apenas admins podem usar este comando!'); break }
    const alvo = getMencao()
    if (!alvo) { enviar('❌ Marque ou responda o usuário que deseja banir!'); break }
    await client.groupParticipantsUpdate(from, [alvo], 'remove')
    enviar(`✅ Usuário removido do grupo!`)
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// 👢 KICK (expulsa do grupo)
// ━━━━━━━━━━━━━━━━━━━━━━
case 'kick': {
    if (!isGrupo) { enviar('❌ Apenas em grupos!'); break }
    if (!(await isAdmin())) { enviar('❌ Apenas admins podem usar este comando!'); break }
    const alvo = getMencao()
    if (!alvo) { enviar('❌ Marque ou responda o usuário que deseja expulsar!'); break }
    await client.groupParticipantsUpdate(from, [alvo], 'remove')
    enviar(`✅ Usuário expulso do grupo!`)
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// 📢 TODOS (marca todos)
// ━━━━━━━━━━━━━━━━━━━━━━
case 'todos': {
    if (!isGrupo) { enviar('❌ Apenas em grupos!'); break }
    if (!(await isAdmin())) { enviar('❌ Apenas admins podem usar este comando!'); break }
    const meta = await client.groupMetadata(from)
    const membros = meta.participants.map(p => p.id)
    const mencoes = membros.map(m => `@${m.split('@')[0]}`).join(' ')
    const aviso = args ? args : '📢 Atenção membros!'
    await client.sendMessage(from, {
        text: `${aviso}\n\n${mencoes}`,
        mentions: membros
    }, { quoted: msgInfo })
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// 🔗 LINK DO GRUPO
// ━━━━━━━━━━━━━━━━━━━━━━
case 'link': {
    if (!isGrupo) { enviar('❌ Apenas em grupos!'); break }
    try {
        const linkInfo = await client.groupInviteCode(from)
        enviar(`🔗 Link do grupo:\nhttps://chat.whatsapp.com/${linkInfo}`)
    } catch {
        enviar('❌ Não consegui pegar o link. O bot precisa ser admin!')
    }
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ APAGAR MENSAGEM
// ━━━━━━━━━━━━━━━━━━━━━━
case 'apagar': {
    const quotedKey = msgInfo.message?.extendedTextMessage?.contextInfo
    if (!quotedKey || !quotedKey.stanzaId) {
        enviar('❌ Responda a mensagem que deseja apagar com !apagar')
        break
    }
    try {
        await client.sendMessage(from, {
            delete: {
                remoteJid: from,
                id: quotedKey.stanzaId,
                participant: quotedKey.participant,
                fromMe: false
            }
        })
    } catch {
        enviar('❌ Não consegui apagar. O bot precisa ser admin para apagar mensagens de outros!')
    }
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// 🤖 COMANDO IA DIRETO
// ━━━━━━━━━━━━━━━━━━━━━━
case 'ia':
case 'gpt':
case 'claude': {
    if (!args) { enviar('❌ Digite sua pergunta! Ex: !ia como funciona o universo?'); break }
    await client.sendPresenceUpdate('composing', from)
    const resposta = await perguntarClaude(args)
    await escrever(resposta)
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// 🎲 DADO
// ━━━━━━━━━━━━━━━━━━━━━━
case 'dado': {
    const lados = parseInt(args) || 6
    if (lados < 2 || lados > 100) { enviar('❌ Use entre 2 e 100 lados! Ex: !dado 20'); break }
    const resultado = Math.floor(Math.random() * lados) + 1
    const emojis = { 1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣', 6: '6️⃣' }
    const emoji = lados === 6 ? (emojis[resultado] || '🎲') : '🎲'
    await escrever(`🎲 *Rolando dado de ${lados} lados...*\n\n${emoji} Resultado: *${resultado}*`)
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// ✊ JOKEMPÔ (Pedra Papel Tesoura)
// ━━━━━━━━━━━━━━━━━━━━━━
case 'jokempo':
case 'ppt':
case 'rps': {
    const escolhas = ['pedra', 'papel', 'tesoura']
    const emojisJogo = { pedra: '🪨', papel: '📄', tesoura: '✂️' }
    const jogadaBot = escolhas[Math.floor(Math.random() * 3)]
    const jogadaUser = args.toLowerCase().trim()

    if (!escolhas.includes(jogadaUser)) {
        enviar(`✊ Jogo de Pedra, Papel e Tesoura!\n\nDigite: *!jokempo pedra*, *!jokempo papel* ou *!jokempo tesoura*`)
        break
    }

    let resultado
    if (jogadaUser === jogadaBot) {
        resultado = '🤝 Empate!'
    } else if (
        (jogadaUser === 'pedra' && jogadaBot === 'tesoura') ||
        (jogadaUser === 'papel' && jogadaBot === 'pedra') ||
        (jogadaUser === 'tesoura' && jogadaBot === 'papel')
    ) {
        resultado = '🏆 Você ganhou!'
    } else {
        resultado = '😈 Bot ganhou!'
    }

    await escrever(
        `✊ *Jokempô!*\n\n` +
        `Você: ${emojisJogo[jogadaUser]} ${jogadaUser}\n` +
        `Bot:  ${emojisJogo[jogadaBot]} ${jogadaBot}\n\n` +
        `${resultado}`
    )
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// 🪢 FORCA
// ━━━━━━━━━━━━━━━━━━━━━━
case 'forca': {
    if (forcaPartidas[remetente]?.ativa) {
        await escrever(`⚠️ Você já tem uma partida ativa!\n\n${mostrarForca(forcaPartidas[remetente])}\n\nDigite *!desistir* para abandonar.`)
        break
    }
    const partida = iniciarForca(remetente)
    await escrever(`🪢 *JOGO DA FORCA INICIADO!*\n\n${mostrarForca(partida)}\n\nDigite uma letra para jogar! (ou *!desistir* para parar)`)
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// 🏳️ DESISTIR (Forca/Trivia)
// ━━━━━━━━━━━━━━━━━━━━━━
case 'desistir': {
    if (forcaPartidas[remetente]?.ativa) {
        const palavra = forcaPartidas[remetente].palavra
        delete forcaPartidas[remetente]
        await escrever(`🏳️ Você desistiu! A palavra era: *${palavra.toUpperCase()}*`)
    } else if (triviaPartidas[remetente]?.ativa) {
        delete triviaPartidas[remetente]
        await escrever('🏳️ Quiz encerrado! Use *!trivia* para jogar de novo.')
    } else {
        enviar('❌ Você não tem nenhum jogo ativo!')
    }
}
break

// ━━━━━━━━━━━━━━━━━━━━━━
// ❓ TRIVIA (Quiz)
// ━━━━━━━━━━━━━━━━━━━━━━
case 'trivia':
case 'quiz': {
    if (triviaPartidas[remetente]?.ativa) {
        const partida = triviaPartidas[remetente]
        const atual = partida.perguntas[partida.indice]
        await escrever(`⚠️ Você já tem um quiz ativo!\n\n❓ Pergunta ${partida.indice + 1}/${partida.perguntas.length}:\n\n*${atual.pergunta}*\n\n${atual.opcoes.join('\n')}\n\nResponda com A, B, C ou D`)
        break
    }

    // Embaralha e pega 5 perguntas
    const embaralhadas = [...perguntasTrivia].sort(() => Math.random() - 0.5).slice(0, 5)
    triviaPartidas[remetente] = {
        perguntas: embaralhadas,
        indice: 0,
        acertos: 0,
        erros: 0,
        ativa: true,
        // Salva a resposta e explicação da pergunta atual
        get resposta() { return this.perguntas[this.indice].resposta },
        get explicacao() { return this.perguntas[this.indice].explicacao }
    }

    const primeira = embaralhadas[0]
    await escrever(
        `❓ *QUIZ INICIADO!* (5 perguntas)\n\n` +
        `Pergunta 1/5:\n\n*${primeira.pergunta}*\n\n${primeira.opcoes.join('\n')}\n\n` +
        `Responda com A, B, C ou D\n(ou *!desistir* para parar)`
    )
}
break

default:
    enviar(`❌ Comando *${comando}* não encontrado. Use *${prefix}menu* para ver os comandos.`)
break

}

} else {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💬 CONVERSA NORMAL (sem comando)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const textoLower = body ? body.trim().toLowerCase() : ''
    if (!textoLower) return

    // Checa respostas fixas primeiro
    const respostaFixa = respostasFixas[textoLower]
    if (respostaFixa) {
        await escrever(respostaFixa)
        return
    }

    // Se for grupo, só responde se mencionar o bot ou responder ele
    if (isGrupo) {
        const mencionouBot = msgInfo.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(client.user.id)
        const respondeuBot = msgInfo.message?.extendedTextMessage?.contextInfo?.participant === client.user.id
        if (!mencionouBot && !respondeuBot) return
    }

    // Chama a IA para responder
    await client.sendPresenceUpdate('composing', from)
    const resposta = await perguntarClaude(body)
    await escrever(resposta)
}

} catch (erro) {
    console.log(erro)
}})

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 CONEXAO DO BOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

client.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && !client.authState.creds.registered && !jaPareou) {
        jaPareou = true
        const Pergunta = await question('Por Favor Me diga Seu número\n')
        const Numero = Pergunta.replace(/[^0-9]/g, '')
        let codigo = await client.requestPairingCode(Numero)
        codigo = codigo?.match(/.{1,4}/g)?.join("-") || codigo
        console.log(`Codigo de Pareamento: ${codigo}`)
        rl.close()
    }

    if (connection === 'open') {
        console.log('✅ LeviBot conectado com sucesso')
    }

    if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        console.log('❌ Conexão fechada. Código:', statusCode)
        if (statusCode !== DisconnectReason.loggedOut) {
            console.log('🔄 Reconectando...')
            ligarbot()
        } else {
            console.log('🚪 Deslogado. Apague a pasta sessao e pareie novamente.')
        }
    }
})
}

ligarbot()
