const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const memeLib = require('./meme-generator')
const fs = require('fs')
const dbUrl = 'mongodb://localhost:27017'
const memeBaseUrl = 'http://localhost:3007/memes/'
const app = express()
const port = process.env.PORT || 3007

/**
 * connects to DB
 *
 */
MongoClient.connect(dbUrl, {useUnifiedTopology: true}, function (err, client) {
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
app.use('/memes', express.static(__dirname + '/memes'))
app.use('/uploads', express.static(__dirname + '/uploads'))

/**
 * default canvas and font options
 *
 * @type {MemeGenerator}
 */
const memeGenerator = new memeLib({
    canvasOptions: { // optional
        canvasWidth: 500,
        canvasHeight: 500
    },
    fontOptions: { // optional
        fontSize: 46,
        fontFamily: 'open sans',
        lineHeight: 1.3
    }
})

/**
 * handles file uploads
 *
 * @param files
 * @returns {Promise<[]>}
 */
async function upload(files) {
    let uploads = []
    if (files) {
        let fileFields = Object.getOwnPropertyNames(files), fileField, fileObject
        let path = __dirname + '/uploads/'
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

app.get('/', function (req, res) {
    res.send('API running')
})

/**
 * loads all files in the uploads path
 */
app.get('/templates', async function (req, res) {
    fs.readdir(__dirname + '/uploads', function (err, fileNames) {
        if (err) return res.status(400).json({error: err})
        res.send(JSON.stringify(fileNames, null, 4))
    })
})

/**
 * creates a meme and gives it an id
 */
app.post('/meme', async function (req, res) {
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
        topX: meme.topX,
        topY: meme.topY,
        bottomText: meme.bottomText,
        bottomX: meme.bottomX,
        bottomY: meme.bottomY,
        url: url
    }).then(function (data) {
        fs.writeFile('./memes/' + fileName, data, async function (err, result) {
            if (err) return res.status(400).json({error: err})
            meme.url = memeBaseUrl + fileName
            meme._id = new ObjectID()
            meme.description = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam'
            meme.votes = 0
            meme.views = 0
            meme.comments = []
            await db.collection('memes').insertOne(meme, function (err, r) {
                if (err) return res.status(400).json({error: err})
                res.json({
                    _id: meme._id,
                    url: meme.url
                })
            })
        })
    })
})

/**
 * updates a meme with a certain id
 */
app.post('/meme/:id', async function (req, res) {
    const db = req.app.get('db')
    let meme = req.body, url, fileName
    const uploads = await upload(req.files)
    if (uploads.length > 0 && !meme.url) {
        url = uploads[0].fullPath
        fileName = uploads[0].fileName
    } else {
        url = meme.url
        fileName = url.split('/')
        fileName = fileName[fileName.length - 1]
    }
    memeGenerator.generateMeme({
        topText: meme.topText,
        topX: meme.topX,
        topY: meme.topY,
        bottomText: meme.bottomText,
        bottomX: meme.bottomX,
        bottomY: meme.bottomY,
        url: url
    }).then(function (data) {
        fs.writeFile('./memes/' + fileName, data, async function (err, result) {
            if (err) return res.status(400).json({error: err})
            meme.url = memeBaseUrl + fileName + '?' + (new Date()).getTime()
            meme._id = ObjectID(req.params.id)
            await db.collection('memes').updateOne({_id: ObjectID(req.params.id)}, {$set: meme}).then(function (e, r) {
                res.send(JSON.stringify(meme, null, 4))
            })
        })
    })
})

/**
 * reads memes from database matching query and options
 */
app.get('/meme', async function (req, res) {
    const db = req.app.get('db')
    const query = JSON.parse(req.query.q)
    if (query.hasOwnProperty('_id')) {
        if (query._id.hasOwnProperty('$lt')) query._id.$lt = ObjectID(query._id.$lt)
        else if (query._id.hasOwnProperty('$gt')) query._id.$gt = ObjectID(query._id.$gt)
        else query._id = ObjectID(query._id)
    }
    const options = JSON.parse(req.query.o)
    await db.collection('memes').find(query, options)
        .toArray(function (err, memes) {
            res.send(JSON.stringify(memes, null, 4))
        })
})

/**
 * reads meme by id
 */
app.get('/meme/:id', async function (req, res) {
    const db = req.app.get('db')
    await db.collection('memes').findOne({_id: ObjectID(req.params.id)}).then(function (meme) {
        res.send(JSON.stringify(meme, null, 4))
    })
})

/**
 * deletes meme by id
 */
app.delete('/meme/:id', async function(req, res) {
    const db = req.app.get('db')
    await db.collection('memes').deleteOne({_id: ObjectID(req.params.id)}, function(err, obj) {
        if (err) return res.sendStatus(404)
        res.sendStatus(200)
    })
})
