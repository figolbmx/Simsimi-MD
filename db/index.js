const { JsonDB } = require("node-json-db");
const { Config } = require("node-json-db/dist/lib/JsonDBConfig");

var db = new JsonDB(new Config("db/db", true, true, '/'));

let stats = {
    msgSent: 1,
    msgRecv: 1,
    filesize: 1,
    autodownload: 1,
    sticker: 1,
    cmd: 1
}
if (!db.exists('/stats')) db.push('/stats', stats)
if (!db.exists('/config')) db.push('/config', {
    session_id: '',
    removeBG: '',
    musixMatch: ''
})

exports.configHandler = {
    get: () => {
        let data = db.getData('/config')
        return data
    },
    update: (key, value) => {
        let data = db.getData('/config')
        data[key] = value
        db.push('/config', data)
    }
}

/**
 * 
 * @param {string} prop 
 * @param {Number} count 
 */
exports.statistics = (prop, count = 1) => {
    if (!db.exists(`/stats/${prop}`)) db.push(`/stats/${prop}`, count)
    let stat = db.getData(`/stats/${prop}`)
    db.push(`/stats/${prop}`, stat += count)
}

exports.info = (path) => {
    if (!db.exists(path)) throw `db ${path} not exists`
    return db.getData(path)
}