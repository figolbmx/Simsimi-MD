/**
 * Author  : Gimenz
 * Name    : nganu
 * Version : 1.0
 * Update  : 08 Januari 2022
 * 
 * If you are a reliable programmer or the best developer, please don't change anything.
 * If you want to be appreciated by others, then don't change anything in this script.
 * Please respect me for making this tool from the beginning.
 */
 const {
    default: makeWASocket,
    DisconnectReason,
    Browsers,
    isJidGroup,
    makeInMemoryStore,
    jidNormalizedUser,
    fetchLatestBaileysVersion,
    getContentType,
    delay,
    isJidStatusBroadcast,
    useMultiFileAuthState,
    S_WHATSAPP_NET
} = require('@adiwajshing/baileys');
const urlencode = require("urlencode")
const { replaceEmoji } = require('replace-emoji');
const { Boom } = require('./node_modules/@hapi/boom')
const _ = require('lodash')
const fetch = require('node-fetch')
const pino = require('pino');
const CFonts = require('cfonts');
const gradient = require('gradient-string');
let package = require('./package.json');
let { info } = require("./db")
let { stats } = info('stats')

///////////////////////////////////
///////////////////////////////////
let { badword, ucaphalo } = require('./lib')
///////////////////////////////////
///////////////////////////////////
const yargs = require('yargs/yargs')
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.config = require('./src/config.json')
global.API = config.api
global.owner = config.owner
global.footer = `© ${package.name} ${new Date().getFullYear()}`
let session;
if (opts['server']) require('./server')
if (opts['test']) {
    session = 'session/test'
} else {
    session = 'session/main'
}


// random emoticon function	
function repeat(str, num) { 
return (new Array(num+1)).join(str); 
}

const msgRetryCounterMap = {}
// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
store.readFromFile('./db/baileys_store_multi.json')
// // save every 10s
setInterval(() => {
    store.writeToFile('./db/baileys_store_multi.json')
}, 10_000)

global.store = store

/** LOCAL MODULE */
const {
    color,
    bgColor,
    msgs,
    Scandir,
    isLatestVersion,
} = require('./utils');
const { Serialize } = require('./lib/simple');
const { statistics } = require('./db');

/** DB */
if (!fs.existsSync('./db/usersJid.json')) {
    fs.writeFileSync('./db/usersJid.json', JSON.stringify([]), 'utf-8')
}

let chatsJid = JSON.parse(fs.readFileSync('./db/usersJid.json', 'utf-8'))
let chatsBlock = JSON.parse(fs.readFileSync('./db/usersBlock.json', 'utf-8'))
const START_TIME = Date.now();
fs.writeFileSync('./src/start.txt', START_TIME.toString())

const start = async () => {
    // LOAD PLUGINS
    CFonts.say(`${package.name}`, {
        font: 'shade',
        align: 'center',
        gradient: ['#12c2e9', '#c471ed'],
        transitionGradient: true,
        letterSpacing: 3,
    });
    CFonts.say(`'${package.name}' Coded By ${package.author}`, {
        font: 'console',
        align: 'center',
        gradient: ['#DCE35B', '#45B649'],
        transitionGradient: true,
    });
    const { version: WAVersion, isLatest } = await fetchLatestBaileysVersion()
    let pkg = await isLatestVersion()
    console.log(color('[SYS]', 'cyan'), `Package Version`, color(`${package.version}`, '#009FF0'), 'Is Latest :', color(`${pkg.isLatest}`, '#f5af19'));
    console.log(color('[SYS]', 'cyan'), `WA Version`, color(WAVersion.join('.'), '#38ef7d'), 'Is Latest :', color(`${isLatest}`, '#f5af19'));
    const { state, saveCreds } = await useMultiFileAuthState(session);
    let client = makeWASocket({
        version: WAVersion,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        msgRetryCounterMap,
        auth: state,
        browser: ["Safari", "Safari", "9.7.0"],
    });
    global.client = client

    store?.bind(client.ev)

    client.ev.on('connection.update', async (update) => {
        if (global.qr !== update.qr) {
            global.qr = update.qr
        }

        const { connection, lastDisconnect } = update;
        if (connection === 'connecting') {
            console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(`${package.name} is Authenticating...`, '#f12711'));
        } else if (connection === 'close') {
            const log = msg => console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(msg, '#f64f59'));
            const statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;

            console.log(lastDisconnect.error);
            if (statusCode === DisconnectReason.badSession) { log(`Bad session file, delete ${session} and run again`); start(); }
            else if (statusCode === DisconnectReason.connectionClosed) { log('Connection closed, reconnecting....'); start() }
            else if (statusCode === DisconnectReason.connectionLost) { log('Connection lost, reconnecting....'); start() }
            else if (statusCode === DisconnectReason.connectionReplaced) { log('Connection Replaced, Another New Session Opened, Please Close Current Session First'); process.exit() }
            else if (statusCode === DisconnectReason.loggedOut) { log(`Device Logged Out, Please Delete ${session} and Scan Again.`); process.exit(); }
            else if (statusCode === DisconnectReason.restartRequired) { log('Restart required, restarting...'); start(); }
            else if (statusCode === DisconnectReason.timedOut) { log('Connection timedOut, reconnecting...'); start(); }
            else {
                console.log(lastDisconnect.error); start()
            }
        } else if (connection === 'open') {
            console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(`${package.name} is now Connected...`, '#38ef7d'));
        }
    });

    client.ev.on('creds.update', saveCreds)
    client.ev.on('messages.upsert', async (msg) => {
        try {
            if (!msg.messages) return
            const m = msg.messages[0]
            if (m.key.fromMe) {
                statistics('msgSent')
            } else {
                statistics('msgRecv')
            }
            if (m.key.fromMe) return
            if (config.autoRead) {
                client.readMessages([m.key])
            }
            if (m.key && isJidStatusBroadcast(m.key.remoteJid)) return
            const from = m.key.remoteJid;
            let type = client.msgType = getContentType(m.message);
            Serialize(client, m)
            let t = client.timestamp = m.messageTimestamp
            const body = (type === 'conversation') ? m.message.conversation : (type == 'ephemeralMessage') ? m.message.ephemeralMessage.message : (type == 'imageMessage') ? m.message.imageMessage.caption : (type == 'videoMessage') ? m.message.videoMessage.caption : (type == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (type == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (type == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (type == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (type === 'messageContextInfo') ? (m.message.listResponseMessage.singleSelectReply.selectedRowId || m.message.buttonsResponseMessage.selectedButtonId || m.text) : ''

            let isGroupMsg = isJidGroup(m.chat)
            let sender = m.sender
            let pushname = client.pushname = m.pushName
            let tipe = bgColor(color(type, 'black'), '#FAFFD1')

            const args = body.trim().split(/ +/).slice(1);
            const flags = [];
            const isBody = body
            const isbadword = await badword(body)
            const ishalo = await ucaphalo(body)

            for (let i of args) {
                if (i.startsWith('--')) flags.push(i.slice(2).toLowerCase())
            }
            
            //random
            let ms = [1000, 2000, 4000, 5000, 4500, 6000];
            let randomms = ms[Math.floor(Math.random() * ms.length)];
            const dontbadword = "gaboleh ngomong kasar, dosa 😡";
            const hola = ["haiiii", "halooooww", "helloowww", "hai juga", "halo jugaa"] 
            let emot = ["🤣", "😳", "🤨", "😂", "😭", "🥰", "😡", ":)", ":*)", ":*("];
            const sapa = ["haiiii", "halooooww", "helloowww", "hai", "haloo", "hadirr", "sayaaaa"]
            const nanya = ["ada apa?", "kenapa?", "ada yg bisa simi bantu?", "kenapa sayang?", "ada apa sayang?", "knpa yang?", "knafa kak?", "ada apa kak??"]
          
            let randomsapa = sapa[Math.floor(Math.random() * sapa.length)];
            let randomnanya = nanya[Math.floor(Math.random() * nanya.length)];
            let randomhola = hola[Math.floor(Math.random() * hola.length)];
            let random = Math.floor(Math.random() * emot.length);
            let randomemot =  repeat(emot[random], Math.floor(Math.random() * 5));
            
            const reply = async (text) => {
                await client.sendPresenceUpdate('composing', from)
                return client.sendMessage(from, { text }, { quoted: m })
            }

            // store user jid to json file
            if (isBody) {
                if (!chatsJid.some((x => x == sender))) {
                    chatsJid.push(sender)
                    fs.writeFileSync('./db/usersJid.json', JSON.stringify(chatsJid), 'utf-8')
                }
            }
            
            //autoread pesan
            if (isBody) {
                    await client.presenceSubscribe(from)
            }
            //pesan cuman bisa di personal (bukan di grup)
            if (isGroupMsg === false) {
                if (isbadword) {
                    await delay(randomms);
                    await client.sendPresenceUpdate('composing', from);
                    client.sendMessage(m.chat, {text : `${dontbadword}`});
                    console.log('[BWD]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~>`, bgColor(color(" BADWORD ", '#FAFFD1'), 'red'), `from`, color(pushname, '#38ef7d'), `\n`)
                } else if (ishalo) {
                    await delay(randomms);
                    await reply(`${randomhola} *${pushname}*`);
                    console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~>`, bgColor(color(" HOLA ", '#FAFFD1'), '#095710'), `from`, color(pushname, '#38ef7d'))
                    console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), `${randomhola} *${pushname}*`, `~>`, bgColor(color(" Jawaban ", 'black'), '#FAFFD1'), `from`, color(`Simi`, '#38ef7d'), "\n")
                } else if (body == "woy" || body == "Woy" || body == "simi" || body == "sim" || body == "simsimi" || body == "Sim" || body == "Simi" || body == "SIM" || body == "SIMI" || body == "bot" || body == "Bot" || body == "BOT") {
                    await delay(randomms);
                    await client.sendPresenceUpdate('composing', from);
                    client.sendMessage(m.chat, {text : `${randomsapa}, ${randomnanya}`});
                    console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~>`, bgColor(color(" MANGGIL SIMI ", '#FAFFD1'), '#095710'), `from`, color(pushname, '#38ef7d'))
                    console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), `${randomsapa}, ${randomnanya}`, `~>`, bgColor(color(" Jawaban ", 'black'), '#FAFFD1'), `from`, color(`Simi`, '#38ef7d'), "\n")
                } else if (type == 'conversation' || type == 'extendedTextMessage') {
                    var jawab = Math.floor(Math.random() * 4);
                    const similo = body.toLowerCase()
                    var reqsimia = replaceEmoji(similo);
                    var reqsimi = urlencode(reqsimia).toLowerCase();
                    const simiu = await fetch(`https://api.simsimi.net/v2/?text=${reqsimi}&lc=id`, { method: "GET" })
                    .then(async res => {
                        const data = await res.json()
                            return data
                        })
                    
                    if (simiu.success === "Aku tidak mengerti apa yang kamu katakan.Tolong ajari aku." || simiu.success === "please enter the text - text=hello" || simiu.success === "= 20/100" || simiu.success === "Jawaban untuk ini adalah dilarang"){
      	                console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(`simi gagal paham`, `red`), color(pushname, '#38ef7d'), "\n")
	                } else if (jawab === 0) {
                        await delay(randomms)
                        await client.sendPresenceUpdate('composing', from);
                        client.sendMessage(m.chat, {text : simiu.success+randomemot});
                        console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~> ${(tipe)} from`, color(pushname, '#38ef7d'))
                        console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), simiu.success, `~>`, bgColor(color(" Jawaban ", 'black'), '#FAFFD1'), `from`, color(`Simi`, '#38ef7d'), "\n")
	                } else if (jawab === 1) {
                        await delay(randomms)
                        await client.sendPresenceUpdate('composing', from);
                        reply(simiu.success+randomemot);
                        console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~> ${(tipe)} from`, color(pushname, '#38ef7d'))
                        console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), simiu.success, `~>`, bgColor(color(" Jawaban ", 'black'), '#FAFFD1'), `from`, color(`Simi`, '#38ef7d'), "\n")
	                } else if (jawab === 2) {
                        await delay(randomms)
                        await client.sendPresenceUpdate('composing', from);
                        client.sendMessage(m.chat, {text : simiu.success});
                        console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~> ${(tipe)} from`, color(pushname, '#38ef7d'))
                        console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), simiu.success, `~>`, bgColor(color(" Jawaban ", 'black'), '#FAFFD1'), `from`, color(`Simi`, '#38ef7d'), "\n")
	                } else {
                        await delay(randomms)
                        await client.sendPresenceUpdate('composing', from);
                        reply(simiu.success);
                        console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~> ${(tipe)} from`, color(pushname, '#38ef7d'))
                        console.log('[MSG]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), simiu.success, `~>`, bgColor(color(" Jawaban ", 'black'), '#FAFFD1'), `from`, color(`Simi`, '#38ef7d'), "\n")
	                }
                } else {
                  console.log('[ETC]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), msgs(m.text), `~> ${(tipe)} from`, color(pushname, '#38ef7d'), `\n`)
                }
                
            }
            
        } catch (error) {
            console.log(color('[ERROR]', 'red'));
        }
    })
    //auto kirim pesan pas di call/vc
    client.ws.on('CB:call', async call => {
        if (call.content[0].tag == 'offer') {
            const callerJid = call.content[0].attrs['call-creator']
            const {  platform, notify, t } = call.attrs
            const caption = `Maaf Simi tidak dapat menerima panggilan :)`
            await client.sendMessage(callerJid, { text: caption })
        }
    })
    //Auto reject pas di call/vc
    client.ev.on('call', async (node) => {
        const { from, id, status } = node[0]
        if (status == 'offer') {
            const stanza = {
                tag: 'call',
                attrs: {
                    from: client.user.id,
                    to: from,
                    id: client.generateMessageTag(),
                },
                content: [
                    {
                        tag: 'reject',
                        attrs: {
                            'call-id': id,
                            'call-creator': from,
                            count: '0',
                        },
                        content: undefined,
                    },
                ],
            }
            await client.query(stanza)
        }
    })
};

start().catch(() => start());