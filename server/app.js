const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const memeLib = require('nodejs-meme-generator')
const fs = require('fs')
//const dbUrl = 'mongodb://localhost:27017'
const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017"
const app = express()
const port = process.env.PORT || 3007
let basePath = '/home/x/workspace/omm/server/'

MongoClient.connect(dbUrl, {}, function (err, client) {
    if (err) throw err
    app.set('db', client.db('omm'))
    app.listen(port, () => {
        console.log(`server is listening on port ${port}`)
    })
})

app.use(cors({origin: true}))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(fileUpload())
// app.use(express.static('.'))
app.use('/memes', express.static(__dirname + '/memes'))

const memeGenerator = new memeLib({
    canvasOptions: { // optional
        canvasWidth: 500,
        canvasHeight: 500
    },
    fontOptions: { // optional
        fontSize: 46,
        fontFamily: 'open sans',
        lineHeight: 2
    }
})

// app.use(function (req, res, next) {
//     res.setHeader('Content-Type', 'application/json')
//     next()
// })

async function upload(files) {
    let uploads = []
    if (files) {
        let fileFields = Object.getOwnPropertyNames(files), fileField, fileObject
        let path = basePath + 'uploads/'
        if (!fs.existsSync(path)) fs.mkdirSync(path, {recursive: true})
        for (let i = 0; i < fileFields.length; i++) {
            fileField = files[fileFields[i]]
            // workaround for dealing with one file only
            let len = fileField.length, isArray = Array.isArray(fileField)
            if (!isArray) len = 1
            for (let j = 0; j < len; j++) {
                if (!isArray) fileObject = fileField
                else fileObject = fileField[j]
                const filePath = path + fileObject.name
                // eslint-disable-next-line no-await-in-loop
                await fileObject.mv(filePath)
                uploads.push({fullPath: filePath, fileName: fileObject.name})
            }
        }
    }
    return uploads
}

app.get('/', function(req, res) {
    res.send('API running')
})

app.get('/meme', async function(req, res) {
    const db = req.app.get('db')
    await db.collection('memes').find({}).toArray(function (err, memes) {
        res.send(JSON.stringify(memes, null, 4))
    })
})

app.get('/meme/:id', async function(req, res) {
    const db = req.app.get('db')
    await db.collection('memes').findOne({_id: ObjectID(req.params.id)}).then(function (meme) {
        res.send(JSON.stringify(meme, null, 4))
    })
})

app.post('/meme', async function(req, res) {
    const db = req.app.get('db')
    let meme = req.body, url, fileName
    const uploads = await upload(req.files)
    if (uploads.length > 0) {
        url = uploads[0].fullPath
        fileName = uploads[0].fileName
    } else {
        url = meme.url
        fileName = url.split('/')
        fileName = fileName[fileName.length - 1]
    }
    memeGenerator.generateMeme({
        topText: meme.topText,
        bottomText: meme.bottomText,
        url: url
    }).then(function (data) {
        fs.writeFile('./memes/' + fileName, data, async function (err, result) {
            if (err) return res.status(400).json({error: err})
            meme.url = 'http://localhost:3007/memes/' + fileName
            meme._id = new ObjectID()
            await db.collection('memes').insertOne(meme, function (err, r) {
                if (err) return res.status(400).json({error: err})
                res.json({
                    _id: meme._id,
                    url: meme.url
                })
                // res.set('Content-Type', 'image/png')
                // res.send(data)
            })
        })
    })
})

