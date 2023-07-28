const {
     default: WAConnection,
     useMultiFileAuthState,
     generateWAMessageFromContent,
     makeCacheableSignalKeyStore
 } = require('@whiskeysockets/baileys')

const pino = require('pino')
const { format } = require('util')
const { exec } = require('child_process')
const cfonts = require('cfonts')
const axios = require('axios')
const path = require('path')
const fs = require('fs')
const Parser = require('expr-eval').Parser
const i18n = require('i18n')

const configFile = 'config.json'

const date = new Date()
const parser = new Parser();

const supportedLanguages = ['en', 'es', 'fr', 'de'];

let commandsConfig = {};
let areCommandsEnabled = true

const getConfig = () => {
    try {
        const data = fs.readFileSync(configFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

const saveConfig = (config) => {
    try {
        fs.writeFileSync(configFile, JSON.stringify(config, null, 4), 'utf8');
    } catch (error) {
        console.error('Error al guardar la configuración en config.json:', error);
    }
};

const sendFile = (filePath, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('Error al leer el archivo:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error interno del servidor');
    } else {
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      res.end(data);
    }
  });
};

const config = getConfig();
if (config.hasOwnProperty('areCommandsEnabled')) {
    areCommandsEnabled = config.areCommandsEnabled;
}

const setCommandsState = (isEnabled) => {
    areCommandsEnabled = isEnabled;
    const config = getConfig();
    config.areCommandsEnabled = isEnabled;
    saveConfig(config);
};
        
        
if (fs.existsSync(configFile)) {
    const configData = fs.readFileSync(configFile, 'utf8');
    commandsConfig = JSON.parse(configData);
} else {
    fs.writeFileSync(configFile, JSON.stringify(commandsConfig, null, 2), 'utf8');
}

i18n.configure({
    locales:['en', 'es'],
    directory: __dirname + '/locales'
});

const { execute, commandString } = require('./src/commands');
const { banner, getGlobalSpinner, splitMessage } = require('./lib/functions')
const { prefix, owner }  = require('./config')



const start = async () => {

    console.log(banner)
    const spinner = getGlobalSpinner();
    spinner.start('Verificando sesión...')
    const sessionFolderPath = 'session';
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolderPath)
    const level = pino({ level: 'silent' })

    try {
        const sessionExists = fs.existsSync(start)
        setTimeout(() => {
            spinner.succeed('Sesión existente encontrada.');
        }, 3000)
    } catch (error) {
        spinner.succeed('No se encontró sesión existente. Escanee el código QR.');
    }

    const client = WAConnection({
        logger: level,
        printQRInTerminal: true,
        browser: ['Mochi Bot', 'Firefox', '3.0.0'],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, level),
        }
    })
    
    client.ev.on('connection.update', v => {
        const { connection, lastDisconnect } = v
        if (connection === 'close') {
            if (lastDisconnect.error.output.statusCode !== 401) {
                start()
            } else {
                exec('rm -rf session')
                console.error('Conexión con WhatsApp cerrada, Escanee nuevamente el código qr!')
                start()
            }
        } else if (connection == 'open') {
            setTimeout(() => {
                console.log(`Mochi es Online`)
            }, 3000);
        }
    })
    client.ev.on('creds.update', saveCreds)
	
    client.ev.on('group-participants.update', async (update) => {
      console.log('group-participants.update event triggered');
      const groupId = update.id;
      const participants = update.participants;
      const action = update.action;
    
      for (const participant of participants) {
        console.log(`participant update: ${participant}, action: ${action}`);
        const user = participant.split('@')[0];
    
        if (action === 'add') {
          const welcomeMessage = `¡Hola @[${user}]! Bienvenido/a al grupo. ¡Esperamos que te diviertas y disfrutes tu estancia aquí! 🎉`;
          client.sendMessage(groupId, {text:welcomeMessage, contextinfo: { mentionedJid: [participant]);}
	}
        } else if (action === 'remove') {
          const goodbyeMessage = `Adiós @[${user}]. Esperamos que hayas tenido una buena experiencia en el grupo. ¡Te echaremos de menos! 👋`;
          client.sendMessage(groupId, {text:goodbyeMessage, mentionedJid: [participant]});
        }
      }
    });
	

    client.ev.on('messages.upsert', async m => {
         if (!m.messages) return

                
        const uptime = process.uptime();
        
        const days = Math.floor(uptime / (24 * 60 * 60));
        const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((uptime % (60 * 60)) / 60);
        const seconds = Math.floor(uptime % 60);

        const dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
        const utcOffset = -5
        const peruTime = new Date(date.getTime() + utcOffset * 60 * 60 * 1000)
         
        const v = m.messages[0]
        const from = v.key.remoteJid
        const sender = (v.key.participant || v.key.remoteJid)
        const type = v.message ? Object.keys(v.message)[0] : null;
        const body =
            (type == 'imageMessage' || type == 'videoMessage') ? v.message[type].caption :
            (type == 'conversation') ? v.message[type] :
            (type == 'extendedTextMessage') ? v.message[type].text : ''
        
        function roundTime(time) {
            return Math.round(time);
        }
        
        const responseMs = Date.now();
        const responseTime = roundTime(responseMs - v.messageTimestamp * 1000);
        const formattedResponseTime = (responseTime / 1000).toFixed(3);
        
        
        const { commandsTaku } = require('./src/messages')
        

        const messageTaku = text => takuMessage(from, {
            text,
            contextInfo: {
                mentionedJid: [sender],
                externalAdReply: {
                    title: `ᴍᴏᴄʜɪ • ᴛᴀᴋᴜ ᴍᴇᴅɪᴀ`,
                    body: `${days} dias ${hours} horas ${minutes} minutos ${seconds} segunfos`,
                    showAdAttribution: true,
                    renderLargerThumbnail: false, 
                    mediaType: 1, 
                    thumbnailUrl: 'https://telegra.ph/file/1c2c3f99dc5d010cf5435.jpg'
                }
            }
        })
        
        const takuMsg = (jid, content, options) =>  client.sendMessage(jid, content, options);
        const takuMedia = text => takuMsg(from, { text, linkPreview: {} }, { quoted: v })
        
        
        const isOwner = owner.number
        const hibernationMessage = '¡Mochi se está tomando una siesta! Zzzz... 🐾';
        const backOnlineMessage = '¡Mochi está de vuelta! 🐾';
        const warningMessage = 'Este comando solo puede ser utilizado por el propietario del bot.';
        
        const cmdConfig = (command, state) => {
            commandsConfig[command] = state;
            fs.writeFileSync(configFile, JSON.stringify(commandsConfig, null, 2), 'utf8');
            messageTaku(`Comando ${command} está ahora ${state ? 'habilitado' : 'deshabilitado'}.`);
        };

        
        
        if (body.startsWith('?saff')) {
            if (sender === isOwner) {
                const [_, state] = body.split(' ');
                if (state === 'on' || state === 'off') {
                    const isEnabled = state === 'on';
                    if (areCommandsEnabled === isEnabled) {
                        takuMedia(from, { text: `Los comandos ya están ${isEnabled ? 'habilitados' : 'deshabilitados'}.` });
                    } else {
                        areCommandsEnabled = isEnabled;
                        if (isEnabled) {
                            takuMedia(from, { text: backOnlineMessage });
                        } else {
                            takuMedia(from, { text: hibernationMessage });
                        }
                    }
                } else {
                    takuMedia(from, { text: 'Comando no válido. Use "on" o "off" para habilitar o deshabilitar comandos.' });
                }
            } else {
                takuMedia(from, { text: warningMessage });
            }
        }
        
        
        if (areCommandsEnabled) {
            switch (true) {
                
                
                case body.startsWith(`$(prefix)youtube`) || body.startsWith(`$(prefix)yt`) || body.startsWith(`$(prefix)yts`) || 
                     body.startsWith(`Youtube`) || body.startsWith(`Yt`) || body.startsWith(`Yts`) || 
                     body.startsWith(`youtube`) || body.startsWith(`yt`) || body.startsWith(`yts`):
                     if (commandsConfig.youtube) {
                         
                     } else {
                        await messageTaku('El comando "YouTube" está deshabilitado.');
                     }
                     break

                case body.startsWith(`${prefix}traductor`) ||
                     body.startsWith(`Traductor`) ||
                     body.startsWith(`traductor`):
                    if (commandsConfig.traslate) {
                        
                    } else {
                        await messageTaku('El comando "Traductor" está deshabilitado.');
                    }
                    break
    
                case body.startsWith(`${prefix}mate`) ||
                  body.startsWith(`${prefix}math`) ||
                  body.startsWith(`${prefix}mat`) ||
                  body.startsWith(`Mate`) ||
                  body.startsWith(`Math`) ||
                  body.startsWith(`Mat`) ||
                  body.startsWith(`mate`) ||
                  body.startsWith(`math`) ||
                  body.startsWith(`mat`):
                    if (commandsConfig.math) {
                        const mathExpression = body.slice(body.indexOf(' ') + 1).trim();
                        try {
                            const result = parser.evaluate(mathExpression);
                            await messageTaku(`🔢 *Operación matemática:*\n${mathExpression}\n🎯 *Resultado:*\n${result}`)
                        } catch (error) {
                            await messageTaku(`*Uso correcto: <comando> <operación matemática>*

*Ejemplo:*

 => math 5 + 3
 => math 10 * 2
 => math (8 - 3) * 4

*Tambien se puede usar:* mat, mate.`)
                        }
                    } else {
                        await messageTaku('El comando "Math" está deshabilitado.');
                    };
                  break;
  
                /*case body.startsWith(`${prefix}traductor`): // TRADUCTOR -----------------------------------
                case body.startsWith(`Traductor`):
                case body.startsWith(`traductor`):
                    const [, sourceLang, message] = body.split(' ');
                    if (supportedLanguages.includes(sourceLang) && message) {
                        await translateMessage(from, message);
                    } else {
                        await messageTaku('Uso incorrecto. Use el comando así: traductor <idioma> <mensaje>');
                        await messageTaku(`Idiomas admitidos: ${supportedLanguages.join(', ')}`);
                    }
                    break;*/

                case body.startsWith(`${prefix}spotify`):
                case body.startsWith(`Spotify`):
                case body.startsWith(`spotify`):
                    if (commandsConfig.spotify) {
                        await messageTaku(`Helou`)
                    } else {
                        await messageTaku('El comando "Spotify" está deshabilitado.');
                    }
                    break

                    
                case body.startsWith(`${prefix}ping`): // PING -----------------------------------
                case body.startsWith(`Ping`):
                case body.startsWith(`ping`):
                    await takuMsg(from, {
                        text: `*Tiempo de respuesta:* ${formattedResponseTime} ms`,
                        contextInfo: {
                            mentionedJid: [sender],
                            externalAdReply: {
                                title: `ᴍᴏᴄʜɪ • ᴛᴀᴋᴜ ᴍᴇᴅɪᴀ`,
                                body: `${days} dias ${hours} horas ${minutes} minutos ${seconds} segunfos`,
                                showAdAttribution: true,
                                renderLargerThumbnail: false, 
                                mediaType: 1, 
                                thumbnailUrl: 'https://telegra.ph/file/1c2c3f99dc5d010cf5435.jpg'
                            }
                        }
                    })
                    break
                    

                    
                case body.startsWith(`${prefix}menu`): // MENU -----------------------------------
                case body.startsWith('Menu'):
                case body.startsWith('menu'):
                    await takuMsg(from, {
                        text: '*M O C H I :* Menu no disponible',
                        contextInfo: {
                            mentionedJid: [sender],
                            externalAdReply: {
                                title: `ᴍᴏᴄʜɪ • ᴛᴀᴋᴜ ᴍᴇᴅɪᴀ`,
                                body: `${days} dias ${hours} horas ${minutes} minutos ${seconds} segunfos`,
                                sourceUrl: 'https://chat.whatsapp.com/G3MvsCbJ2nx3aC2nxkPVHX',
                                showAdAttribution: true,
                                renderLargerThumbnail: true, 
                                mediaType: 1, 
                                thumbnailUrl: 'https://telegra.ph/file/76a40b64081a9b9fb416f.jpg'
                            }
                        }
                    }, {
                        quoted : v
                    })
                    break
                
                case body.startsWith('tag'): // TAG -----------------------------------
                case body.startsWith('Tag'):
                case body.startsWith('TAG'):
                    if (from.endsWith('@g.us')) {
                        const groupMetadata = await client.groupMetadata(from);
                        console.log('groupMetadata:', groupMetadata);
                        const groupAdmins = groupMetadata.participants.filter(participant => participant.isAdmin).map(admin => admin.id);
                        const isGroupAdmin = groupAdmins.includes(sender) || sender === owner.number;
                
                        if (isGroupAdmin) {
                            const mentionedJids = groupMetadata.participants.map(participant => participant.id);
                            console.log('mentionedJids:', mentionedJids);
                            if (mentionedJids && mentionedJids.length > 0) {
                                const message = body.slice(4).trim();
                                if (message.length > 0) {
                                    const media = v.message.imageMessage || v.message.videoMessage || v.message.audioMessage || v.message.stickerMessage || v.message.pdfMessage;
                                    if (media) {
                                        takuMsg(from, media, {
                                            contextInfo: {
                                                mentionedJid: [ mentionedJids, sender ]
                                            }
                                        });
                                    } else {
                                        const textMessage = { text: message, contextInfo: { mentionedJid: [ mentionedJids, sender ] } };
                                        console.log('textMessage:', textMessage);
                                        takuMsg(from, textMessage);
                                    }
                                } else {
                                    await messageTaku('El mensaje está vacío. Por favor, incluye un mensaje después del comando "tag".');
                                }
                            } else {
                                await messageTaku('No se encontraron usuarios en el grupo para mencionar.');
                            }
                        } else {
                            await messageTaku('Este comando solo puede ser utilizado por los administradores del grupo o el propietario.');
                        }
                    } else {
                        await messageTaku('Este comando solo puede usarse en grupos.');
                    }
                    break
                    
                case body.startsWith(`${prefix}cmd`): // CMD MENU -----------------------------------
                case body.startsWith(`Cmd`):
                case body.startsWith(`cmd`):
                    if (isOwner) {
                        const [_, command, state] = body.split(' ');
                        if (command && (state === 'on' || state === 'off')) {
                            const commandName = command.toLowerCase();
                            const isEnabled = state === 'on';
                            if (commandsConfig.hasOwnProperty(commandName)) {
                                cmdConfig(commandName, isEnabled);
                            } else {
                                await messageTaku('Comando no válido. Use "on" o "off" para habilitar o deshabilitar comandos.');
                            }
                        } else {
                            await messageTaku('Uso incorrecto. Use el comando así: cmd <comando> <on/off>');
                        }
                    } else {
                        await messageTaku('Este comando solo puede ser utilizado por el propietario del bot.');
                    }
                    break
                    

                    

            } // Fin Switch
        }

        const userEval = [
	        `51968374620`,
		    `595985902159`
	    ]
        const takuEval = async (text) => {
            msg = generateWAMessageFromContent(from, {
                extendedTextMessage: {
                    text,
                    contextInfo: {
                        externalAdReply: {
                            title: 'ᴛᴀᴋᴜ  ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ',
                            body: `${days} dias ${hours} horas ${minutes} minutos ${seconds} segunfos`,
                            showAdAttribution: true,
                            thumbnailUrl: 'https://telegra.ph/file/1c2c3f99dc5d010cf5435.jpg'
                        }}
                }}, {
                    quoted: v
                })
                await client.relayMessage(from, msg.message, {})
        }

        if (![userEval, client.user.id.split`:`[0]].includes(sender)) {
            if ( body.startsWith('>')) {
                try { 
                    let value = await eval(`(async() => { ${body.slice(1)} })()`)
                    await takuEval(format(value))
                } catch (e) {
                    await takuEval(e)
                }
            }
            if (body.startsWith('<')) {
                try {
                    let value = await eval(`(async() => { return ${body.slice(1)} })()`)
                    await takuEval(format(value))
                } catch(e) {
                    await takuEval(e)
                }
            }
        }
   })
   
}
start();
                                         
