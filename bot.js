/*  Baileys
 * npm install @whiskeysockets/baileys
 * npm install qrcode-terminal
 * npm install pino
 * npm install @hapi/boom
*/

// Importar função para criar o socket
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const lmstudioUrl = 'http://localhost:1234'; // URL LMStudio
const conversationHistory = new Map();
const userLanguages = new Map();

const KNOWNLEDGE_FOLDER = path.join(__dirname, 'knowledge');

// Números autorizados
const numerosAutorizados = [
    '5516991530475',
    '204706848743514'
];

console.log('Bot das Olimpíadas com LMStudio iniciando....');
console.log(`Configurado para responder aos números: ${numerosAutorizados.join(', ')}\n`);

// Carregar base de conhecimento
function loadKnowledgeBase() {
    console.log('Carregando base de conhecimento sobre Olimpíadas...');
    
    if (!fs.existsSync(KNOWLEDGE_FOLDER)) {
        fs.mkdirSync(KNOWLEDGE_FOLDER, { recursive: true });
        console.log('Pasta de conhecimento criada. Adicione arquivos TXT sobre Olimpíadas na pasta "knowledge".');
        return '';
    }

    let allContent = '';
    const files = fs.readdirSync(KNOWLEDGE_FOLDER);
    
    files.forEach(file => {
        if (file.endsWith('.txt') || file.endsWith('.json')) {
            const filePath = path.join(KNOWLEDGE_FOLDER, file);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                allContent += `\n=== ${file} ===\n${content}\n`;
                console.log(`Arquivo carregado: ${file}`);
            } catch (error) {
                console.error(`Erro ao ler arquivo ${file}:`, error.message);
            }
        }
    });
    
    if (!allContent) {
        console.log('Nenhum arquivo de conhecimento encontrado na pasta.');
    } else {
        console.log(`Base de conhecimento carregada com sucesso!`);
    }
    
    return allContent;
}

const knowledgeContent = loadKnowledgeBase();

// Comando de ajuda
function getHelpMessage(language = 'pt') {
    const messages = {
        pt: `🏅 *BOT DAS OLIMPÍADAS* 🌍

*Comandos disponíveis:*
/ajuda - Mostra esta mensagem de ajuda
/hacker [idioma] - Altera o idioma das respostas (ex: /hacker en, /hacker es, /hacker fr)
/historico - História dos Jogos Olímpicos
/medalhas - Quadro de medalhas histórico
/esportes - Lista de esportes olímpicos
/brasil - Desempenho do Brasil nas Olimpíadas

*Funcionalidades:*
- Consulta sobre atletas, modalidades e recordes
- Dados históricos das Olimpíadas
- Informações sobre países e medalhas
- Base de conhecimento atualizável
- Suporte a múltiplos idiomas

*Como usar:*
Pergunte sobre qualquer aspecto dos Jogos Olímpicos!`,

        en: `🏅 *OLYMPICS BOT* 🌍

*Available commands:*
/ajuda - Shows this help message
/hacker [language] - Changes response language (ex: /hacker pt, /hacker es, /hacker fr)
/historico - History of the Olympic Games
/medalhas - Historical medal table
/esportes - List of Olympic sports
/brasil - Brazil's Olympic performance

*Features:*
- Queries about athletes, sports and records
- Olympic historical data
- Country and medal information
- Updatable knowledge base
- Multi-language support

*How to use:*
Ask about any aspect of the Olympic Games!`,

        es: `🏅 *BOT DE OLIMPIADAS* 🌍

*Comandos disponibles:*
/ajuda - Muestra este mensaje de ayuda
/hacker [idioma] - Cambia el idioma de las respuestas (ej: /hacker pt, /hacker en, /hacker fr)
/historico - Historia de los Juegos Olímpicos
/medalhas - Cuadro de medallas histórico
/esportes - Lista de deportes olímpicos
/brasil - Desempeño de Brasil en las Olimpíadas

*Características:*
- Consultas sobre atletas, deportes y récords
- Datos históricos olímpicos
- Información sobre países y medallas
- Base de conocimiento actualizable
- Soporte multiidioma

*Cómo usar:*
¡Pregunta sobre cualquier aspecto de los Juegos Olímpicos!`
    };
    
    return messages[language] || messages.pt;
}

// Comandos rápidos
function handleQuickCommands(text, language = 'pt') {
    const lowerText = text.toLowerCase();
    
    if (lowerText === '/historico' || lowerText === 'historico') {
        return {
            pt: `📜 *HISTÓRIA DAS OLIMPÍADAS*

Os Jogos Olímpicos têm uma rica história desde a Grécia Antiga até os dias atuais. Para informações detalhadas sobre edições específicas, atletas marcantes e eventos históricos, consulte nossa base de conhecimento.

Use /medalhas para ver o quadro histórico ou pergunte sobre uma Olimpíada específica!`,

            en: `📜 *OLYMPIC GAMES HISTORY*

The Olympic Games have a rich history from Ancient Greece to the present day. For detailed information about specific editions, remarkable athletes and historical events, check our knowledge base.

Use /medalhas to see the historical medal table or ask about a specific Olympics!`,

            es: `📜 *HISTORIA DE LAS OLIMPIADAS*

Los Juegos Olímpicos tienen una rica historia desde la Antigua Grecia hasta la actualidad. Para información detallada sobre ediciones específicas, atletas destacados y eventos históricos, consulta nuestra base de conocimiento.

¡Usa /medalhas para ver el cuadro histórico o pregunta sobre una Olimpiada específica!`
        }[language];
    }
    
    if (lowerText === '/medalhas' || lowerText === 'medalhas') {
        return {
            pt: `🏆 *QUADRO DE MEDALHAS*

O quadro de medalhas olímpico varia a cada edição dos Jogos. Países como Estados Unidos, China, Rússia e Grã-Bretanha costumam liderar o ranking.

Para informações atualizadas sobre medalhas por país, edição específica ou desempenho histórico detalhado, consulte nossa base de conhecimento completa.`,

            en: `🏆 *MEDAL TABLE*

The Olympic medal table changes with each Games edition. Countries like United States, China, Russia and Great Britain usually lead the ranking.

For updated information on medals by country, specific edition or detailed historical performance, check our complete knowledge base.`,

            es: `🏆 *CUADRO DE MEDALLAS*

El cuadro de medallas olímpico varía en cada edición de los Juegos. Países como Estados Unidos, China, Rusia y Gran Bretaña suelen liderar el ranking.

Para información actualizada sobre medallas por país, edición específica o desempeño histórico detallado, consulta nuestra base de conocimiento completa.`
        }[language];
    }
    
    if (lowerText === '/esportes' || lowerText === 'esportes') {
        return {
            pt: `⚽ *ESPORTES OLÍMPICOS*

Os Jogos Olímpicos incluem diversas modalidades esportivas divididas entre verão e inverno. Novos esportes são adicionados periodicamente, como skate, surf e escalada esportiva.

Para a lista completa de esportes, regras, atletas destacados e curiosidades sobre cada modalidade, consulte nossa base de conhecimento.`,

            en: `⚽ *OLYMPIC SPORTS*

The Olympic Games include various sports divided between summer and winter. New sports are added periodically, such as skateboarding, surfing and sport climbing.

For the complete list of sports, rules, outstanding athletes and curiosities about each modality, check our knowledge base.`,

            es: `⚽ *DEPORTES OLÍMPICOS*

Los Juegos Olímpicos incluyen varias modalidades deportivas divididas entre verano e invierno. Nuevos deportes se añaden periódicamente, como skateboarding, surf y escalada deportiva.

Para la lista completa de deportes, reglas, atletas destacados y curiosidades sobre cada modalidad, consulta nuestra base de conocimiento.`
        }[language];
    }
    
    if (lowerText === '/brasil' || lowerText === 'brasil') {
        return {
            pt: `🇧🇷 *BRASIL NAS OLIMPÍADAS*

O Brasil tem uma trajetória olímpica em crescimento, com destaque para esportes como vôlei, judô, natação e atletismo. Nossos atletas conquistaram medalhas importantes ao longo dos anos.

Para informações detalhadas sobre medalhas brasileiras, atletas históricos, desempenho por edição e curiosidades, consulte nossa base de conhecimento especializada.`,

            en: `🇧🇷 *BRAZIL IN THE OLYMPICS*

Brazil has a growing Olympic trajectory, with highlights in sports such as volleyball, judo, swimming and athletics. Our athletes have won important medals over the years.

For detailed information about Brazilian medals, historical athletes, performance by edition and curiosities, check our specialized knowledge base.`,

            es: `🇧🇷 *BRASIL EN LAS OLIMPIADAS*

Brasil tiene una trayectoria olímpica en crecimiento, con destaque en deportes como vóley, judo, natación y atletismo. Nuestros atletas han conquistado medallas importantes a lo largo de los años.

Para información detallada sobre medallas brasileñas, atletas históricos, desempeño por edición y curiosidades, consulta nuestra base de conocimiento especializada.`
        }[language];
    }
    
    return null;
}

// Conectando ao WhatsApp
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Bot Olimpíadas', 'Chrome', '1.0']
    });
    
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('Escaneie o QRCODE abaixo:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
            axios.get(`${lmstudioUrl}/v1/models`, { timeout: 5000 })
                .then(() => console.log('✅ LMStudio online e pronto para uso!'))
                .catch(() => console.log('⚠️  LMStudio offline. Inicie o LMStudio para respostas inteligentes.'));
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        
        const numeroRemetente = from.split('@')[0];
        if (!numerosAutorizados.includes(numeroRemetente)) {
            console.log(`Mensagem ignorada de: ${numeroRemetente}`);
            return;
        }

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        console.log(`Mensagem de ${from}: ${text}`);

        try {
            const userLanguage = userLanguages.get(from) || 'pt';
            
            if (text.toLowerCase() === '/ajuda' || text.toLowerCase() === 'ajuda') {
                await sock.sendMessage(from, { text: getHelpMessage(userLanguage) });
                return;
            }
            
            if (text.toLowerCase().startsWith('/hacker')) {
                const parts = text.split(' ');
                if (parts.length > 1) {
                    const newLanguage = parts[1].toLowerCase();
                    const supportedLanguages = ['pt', 'en', 'es', 'fr', 'it', 'de'];
                    
                    if (supportedLanguages.includes(newLanguage)) {
                        userLanguages.set(from, newLanguage);
                        const confirmation = {
                            pt: `✅ Idioma alterado para: ${newLanguage.toUpperCase()}`,
                            en: `✅ Language changed to: ${newLanguage.toUpperCase()}`,
                            es: `✅ Idioma cambiado a: ${newLanguage.toUpperCase()}`,
                            fr: `✅ Langue changée en: ${newLanguage.toUpperCase()}`,
                            it: `✅ Lingua cambiata in: ${newLanguage.toUpperCase()}`,
                            de: `✅ Sprache geändert zu: ${newLanguage.toUpperCase()}`
                        }[newLanguage] || `✅ Language changed to: ${newLanguage.toUpperCase()}`;
                        
                        await sock.sendMessage(from, { text: confirmation });
                    } else {
                        await sock.sendMessage(from, { 
                            text: `❌ Idioma não suportado. Use: ${supportedLanguages.join(', ')}` 
                        });
                    }
                } else {
                    await sock.sendMessage(from, { 
                        text: `🌐 Idioma atual: ${userLanguage.toUpperCase()}\nUse: /hacker [pt|en|es|fr|it|de]` 
                    });
                }
                return;
            }
            
            const quickResponse = handleQuickCommands(text, userLanguage);
            if (quickResponse) {
                await sock.sendMessage(from, { text: quickResponse });
                return;
            }

            const isOnline = await axios.get(`${lmstudioUrl}/v1/models`, { timeout: 3000 })
                .then(() => true).catch(() => false);
                
            if (!isOnline) {
                await sock.sendMessage(from, { 
                    text: '⚠️ LMStudio offline. Comandos básicos disponíveis. Use /ajuda para ver opções.' 
                });
                return;
            }
        
            const history = conversationHistory.get(from) || [];
            const userLang = userLanguages.get(from) || 'pt';

            let systemMessage = {
                pt: 'Você é um especialista em Jogos Olímpicos. Responda em português com informações precisas sobre história, atletas, esportes, medalhas e curiosidades olímpicas. Seja informativo e envolvente.',
                en: 'You are an expert in Olympic Games. Respond in English with accurate information about Olympic history, athletes, sports, medals and curiosities. Be informative and engaging.',
                es: 'Eres un experto en Juegos Olímpicos. Responde en español con información precisa sobre historia olímpica, atletas, deportes, medallas y curiosidades. Sé informativo y atractivo.',
                fr: 'Vous êtes un expert des Jeux Olympiques. Répondez en français avec des informations précises sur l\'histoire olympique, les athlètes, les sports, les médailles et les curiosités. Soyez informatif et engageant.',
                it: 'Sei un esperto dei Giochi Olimpici. Rispondi in italiano con informazioni accurate sulla storia olimpica, atleti, sport, medaglie e curiosità. Sii informativo e coinvolgente.',
                de: 'Sie sind ein Experte für Olympische Spiele. Antworten Sie auf Deutsch mit genauen Informationen zur Olympischen Geschichte, Athleten, Sportarten, Medaillen und Kuriositäten. Seien Sie informativ und ansprechend.'
            }[userLang] || 'You are an expert in Olympic Games. Respond with accurate information about Olympic history, athletes, sports and medals. Be informative and engaging.';

            if (knowledgeContent) {
                systemMessage += '\n\nBASE DE CONHECIMENTO SOBRE OLIMPÍADAS:\n' + knowledgeContent;
                systemMessage += '\n\nUse estas informações como referência principal para suas respostas sobre Olimpíadas.';
            }

            const messagesForAi = [
                { role: 'system', content: systemMessage },
                ...history.slice(-6),
                { role: 'user', content: text }
            ];

            const response = await axios.post(`${lmstudioUrl}/v1/chat/completions`, {
                model: 'local-model',
                messages: messagesForAi,
                temperature: 0.3,
                max_tokens: 500
            }, { timeout: 30000 });

            const aiResponse = response.data.choices[0].message.content;
            
            history.push({ role: 'user', content: text });
            history.push({ role: 'assistant', content: aiResponse });
            if (history.length > 10) history.splice(0, 4);
            conversationHistory.set(from, history);
            
            await sock.sendMessage(from, { text: aiResponse });
            console.log(`🤖 IA: ${aiResponse}`);

        } catch (error) {
            console.error('Erro ao processar mensagem:', error.message);
            await sock.sendMessage(from, { 
                text: '❌ Erro ao processar sua pergunta. Use /ajuda para comandos disponíveis.' 
            });
        }           
    });
}

connectToWhatsApp();