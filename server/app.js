/**
 * Route Imports
 */
const auth = require("./authentication")
const template = require("./template")
const meme = require("./meme")
/**
 * Other Dependencies
 */
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const MongoClient = require('mongodb').MongoClient
const dbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017'
const app = express()
const port = process.env.PORT || 3007
var path = require('path');


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


/**
 * Setup app environment
 */
app.use(cors({origin: true}))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(fileUpload())
app.use('/memes', express.static(__dirname + '/memes'))
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use('/zips', express.static(__dirname + '/zips'))
app.use('/videos', express.static(__dirname + '/videos'))


/*
* User authorization routes
*/
app.post('/login', auth.login)
app.post('/register', auth.register)
app.post('/userdata', auth.getUserdata)
app.get('/auth/delete', auth.deleteAuthorization)
app.get('/auth', auth.authorize)
app.post('/logout', auth.logout)

/*
* Template routes
*/
app.get('/templates', template.loadAllTemplates)
app.post('/template', template.upsertTemplate)
app.post('/template/description', template.updateTemplateDescription)
app.post('/template/generated', template.updateTemplateGenCount)
app.post('/template/vote/:id', template.updateVote)

/*
* Meme routes
*/
app.post('/meme', meme.createMeme)
app.post('/meme/comment/:id', meme.commentMeme)
app.post('/meme/tag/:id', meme.tagMeme)
app.post('/meme/vote/:id', meme.voteMeme)
app.post('/meme/:id', meme.updateMeme)
app.get('/meme', meme.getMeme)
app.get('/meme/random', meme.getRandomMeme)
app.get('/meme/:id', meme.getMemeByID)
app.delete('/meme/:id', meme.deleteMemeByID)
app.post('/draft/delete/:id', meme.deleteDraftByID)
app.get('/draft/user', meme.getDraftForUser)
app.delete('/draft', meme.deleteAllDrafts)
app.get('/downloads', meme.getMemesAsZip)
app.get('/drafts', meme.getDrafts)
app.post('/createMemes', meme.createMultipleMemes)
app.post('/screenshot', meme.createScreenshot)
app.get('/draft', meme.getAllDrafts)
app.get("/video", meme.streamVideo)

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
    //res.send('OMM WS21 - Meme Generator - API running')
})