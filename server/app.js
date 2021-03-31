const express = require('express')
const SHA256 = require("crypto-js/sha256")
const PBKDF2 = require("crypto-js/pbkdf2")
const WordArray = require("crypto-js/lib-typedarrays")
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const memeLib = require('./meme-generator')
const fs = require('fs')
var AdmZip = require("adm-zip");
const dbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017'
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

const ResponseType = {
    DATA: 0,
    ERROR: 1
}

app.use(cors({origin: true}))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(fileUpload())
app.use('/memes', express.static(__dirname + '/memes'))
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use('/zips', express.static(__dirname + '/zips'))


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
    res.send('OMM WS21 - Meme Generator - API running')
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
    const userid = ObjectID(req.body.userid)
    const cred = req.body.cred
    const draft = req.body.draft
    let userdata = {_id: userid, username: req.body.username}
    const hasPermission = isAutherized(db, userid, cred)
    
    if (uploads.length > 0) {
        url = uploads[0].fullPath
        fileName = uploads[0].fileName
    } else {
        url = meme.url
        fileName = url.split('/')
        fileName = fileName[fileName.length - 1]
    }

    if(!req.body.cred && !req.body.userid && !req.body.username) {
        console.log("Malformed request body!")
        sendResponse(res, ResponseType.ERROR, "Malformed request body!")
        return
    }

    if(hasPermission) {
        const memeid = new ObjectID()
        const uploads = await upload(req.files)
        if (uploads.length > 0) {
            url = uploads[0].fullPath
            fileName = uploads[0].fileName.split('.')
            const fileEnd = fileName[fileName.length - 1]
            fileName = memeid + "." + fileEnd
        } else {
            url = meme.url
            fileName = url.split('.')
            const fileEnd = fileName[fileName.length - 1]
            fileName = memeid + "." + fileEnd
        }
        memeGenerator.generateMeme({
            topText: meme.topText,
            topSize: meme.topSize,
            topX: meme.topX,
            topY: meme.topY,
            topBold: meme.topBold,
            topItalic: meme.topItalic,
            topColor: meme.topColor,
            bottomText: meme.bottomText,
            bottomSize: meme.bottomSize,
            bottomX: meme.bottomX,
            bottomY: meme.bottomY,
            bottomBold: meme.bottomBold,
            bottomItalic: meme.bottomItalic,
            bottomColor: meme.bottomColor,
            url: url
        }).then(function (data) {
            fs.writeFile('./memes/' + fileName, data, async function (err, result) {
                if (err) return res.status(400).json({error: err})
                meme.url = memeBaseUrl + fileName
                meme._id = memeid
                meme.votes = 0
                meme.views = 0
                meme.comments = []
                meme.createdBy = userdata
                meme.dateAdded = new Date(Date.now()).toISOString()
                meme.voteData = []

                const data = {
                    memeid: ObjectID(meme._id)
                }

                if(draft == "false") {

                    const newValues = {
                        $push: {
                            memes: data
                        }
                    }

                    // Eventuell unnötig
                    /*
                    await db.collection('users').updateOne({_id: userid}, newValues).then(function(e, r) {
                        
                        delete meme.userid
                        delete meme.username
                        delete meme.cred
                        delete meme.draft

                        db.collection('memes').insertOne(meme, function (err, r) {
                            if (err) return res.status(400).json({error: err})
                            console.log("202- Meme eingefügt!")
                            res.json({
                                _id: meme._id,
                                url: meme.url
                            })
                        })
                    })
                    */
                } else {

                    const newValues = {
                        $push: {
                            drafts: data
                        }
                    }

                    await db.collection('users').updateOne({_id: userid}, newValues).then(function(e, r) {
                        
                        delete meme.userid
                        delete meme.username
                        delete meme.cred
                        delete meme.draft

                        db.collection('drafts').insertOne(meme, function (err, r) {
                            if (err) return res.status(400).json({error: err})
                            console.log("Draft created")
                            res.json({
                                _id: meme._id,
                                url: meme.url
                            })
                        })
                    })
                }
            })
        })
    } else {
        sendResponse(res, ResponseType.ERROR, "Could not create meme! Make sure to login.")
    }
})

app.post('/meme/comment/:id', async function(req, res) {
    const db = req.app.get('db')
    const query = {_id: ObjectID(req.params.id)}
    const userid = req.body.userid
    const username = req.body.username
    const cred = req.body.cred
    const comment = req.body.comment

    const hasPermission = isAutherized(db, userid, cred)

    if(hasPermission){
        var newValues = {
            $push: {
                comments: {
                    userid: ObjectID(userid),
                    username: username,
                    comment: comment,
                    date: new Date(Date.now()).toISOString()
                }
            }
        }

        db.collection('memes').updateOne(query, newValues, function(err, result){
            if (err) res.status(400).json({error: err})

            newValues = {
                $push: {
                    comments: {
                        memeid: ObjectID(req.params.id),
                        userid: ObjectID(userid),
                        username: username,
                        comment: comment,
                        date: new Date(Date.now()).toISOString()
                    }
                }
            }

            db.collection('users').updateOne({_id: ObjectID(userid)}, newValues, function(err, result){
                if (err) res.status(400).json({error: err})
                res.send(JSON.stringify({status: "OK", text:"Comment successfully posted!"}, null, 4))
            })
        })

    } else {
        res.send(JSON.stringify({status: "ERROR", text:"User not authorized!"}, null, 4))
    }

})

app.post('/meme/tag/:id', async function(req, res) {
    const db = req.app.get('db')
    const tags = req.body.tags
    const query = {_id: ObjectID(req.params.id)}
    const userid = req.body.userid
    const cred = req.body.cred

    const hasPermission = isAutherized(db, userid, cred)

    if(hasPermission) {
        const newValues = { 
            $push: {
                tags: tags
            }
        }

        await db.collection('memes').updateOne(query, newValues, function(err, result){
            if(err) sendResponse(res, ResponseType.ERROR, "Failed to commit tag!")
            sendResponse(res, ResponseType.DATA, "Successfully commited tag!")
        })
    } else {
        sendResponse(res, ResponseType.ERROR, "User not authorized!")
    }
    
})

app.post('/meme/vote/:id', async function(req, res) {
    const db = req.app.get('db')
    const votes = req.body.vote < 0 ? -1 : 1
    const isPositive = votes > 0 ? true : false
    const userid = req.body.userid
    const cred = req.body.cred
    const query = { _id: ObjectID(req.params.id) }
    var newValues = { $inc: {votes: votes} }

    const hasPermission = isAutherized(db, userid, cred)

    if(hasPermission) {
        db.collection('users').findOne({_id: ObjectID(userid)}, function(err, userdata) {
            if (err) {
                sendResponse(res, ResponseType.ERROR, "Database failure!")
            }
            const votes = userdata.votes
            if(votes) {
                findVote(votes, req.params.id).then((vote) => {
                    // User has already voted
                    if(vote && vote.length != 0){
                        if (vote.isPositive != isPositive) {
                            // Swap votes
                            if(isPositive) {
                                newValues = { $inc: {votes: 2} }
                            } else {
                                newValues = { $inc: {votes: -2} }
                            }

                            db.collection('memes').updateOne(query, newValues, function(err, result) {
                                if (err) {
                                    sendResponse(res, ResponseType.ERROR, "Database failure!")
                                } else {

                                    votes.some(function(v, index) {
                                        if(v.memeid == req.params.id) {
                                            v.isPositive = isPositive
                                            return true
                                        }
                                    })

                                    newValues = {
                                        $set: {
                                            votes: votes
                                        }
                                    }

                                    db.collection('users').updateOne({_id: ObjectID(userid)}, newValues, function(err, result){
                                        if (err) {
                                            sendResponse(res, ResponseType.ERROR, "Database failure!")
                                        } else {
                                            sendResponse(res, ResponseType.DATA, "Successfully voted!")
                                        }
                                    })
                                }
                            })
                        } else {
                            sendResponse(res, ResponseType.ERROR, "User already voted!")
                        }
                    } else {
                        db.collection('memes').updateOne(query, newValues, function(err, result) {
                            if (err) {
                                sendResponse(res, ResponseType.ERROR, "Database failure!")
                            } else {
                                const data = {
                                    memeid: ObjectID(req.params.id),
                                    isPositive: isPositive
                                }

                                newValues = {
                                    $push: {
                                        votes: data
                                    }
                                }

                                db.collection('users').updateOne({_id: ObjectID(userid)}, newValues, function(err, result){
                                    if (err) {
                                        sendResponse(res, ResponseType.ERROR, "Database failure!")
                                    } else {
                                        sendResponse(res, ResponseType.DATA, "Successfully voted!")
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    } else {
        sendResponse(res, ResponseType.ERROR, "User not authorized!")
    }
})

/**
 * updates a meme with a certain id
 */
app.post('/meme/:id', async function (req, res) {
    const db = req.app.get('db')
    let meme = req.body, url, fileName
    const userid = req.body.userid
    const cred = req.body.cred
    const tags = JSON.parse(req.body.tags)
    const draft = req.body.draft
    let userdata = {_id: userid, username: req.body.username}

    const hasPermission = isAutherized(db, userid, cred)

    if(!req.body.cred && !req.body.userid && !req.body.username) {
        console.log("Malformed request body!")
        sendResponse(res, ResponseType.ERROR, "Malformed request body!")
        return
    }

    if(hasPermission) {
        const uploads = await upload(req.files)
        if (uploads.length > 0 && !meme.url) {
            url = uploads[0].fullPath
            fileName = uploads[0].fileName.split('.')
            const fileEnd = fileName[fileName.length - 1]
            fileName = ObjectID(req.params.id) + "." + fileEnd
        } else {
            url = meme.url
            fileName = url.split('.')
            const fileEnd = fileName[fileName.length - 1]
            fileName = ObjectID(req.params.id) + "." + fileEnd
        }

        memeGenerator.generateMeme({
            topText: meme.topText,
            topSize: meme.topSize,
            topX: meme.topX,
            topY: meme.topY,
            topBold: meme.topBold,
            topItalic: meme.topItalic,
            topColor: meme.topColor,
            bottomText: meme.bottomText,
            bottomSize: meme.bottomSize,
            bottomX: meme.bottomX,
            bottomY: meme.bottomY,
            bottomBold: meme.bottomBold,
            bottomItalic: meme.bottomItalic,
            bottomColor: meme.bottomColor,
            url: url
        }).then(function (data) {
            fs.writeFile('./memes/' + fileName, data, async function (err, result) {
                if (err) return res.status(400).json({error: err})
                meme.url = memeBaseUrl + fileName + '?' + (new Date()).getTime()
                meme._id = ObjectID(req.params.id)
                meme.votes = 0
                meme.views = 0
                meme.comments = []
                meme.createdBy = userdata
                meme.tags = tags
                delete meme.userid
                delete meme.username
                delete meme.cred
                delete meme.draft

                if(draft == "false"){
                    db.collection('memes').insertOne(meme, function (err, r) {
                        console.log("476 - Meme eingefügt!")
                        // Delete draft from db
                        db.collection('drafts').deleteOne({_id: ObjectID(req.params.id)}).then(function (e, r) {
                            
                            console.log("Draft deleted")
                            console.log("Userdata: ", userdata)

                            db.collection('users').findOne({_id: ObjectID(userid)}, function(err, userdata) {
                                if (err) {
                                    sendResponse(res, ResponseType.ERROR, "Database failure!")
                                }

                                var drafts = userdata.drafts

                                drafts.some(function(d, index) {
                                    if(d.memeid == req.params.id) {
                                        delete d
                                        return true
                                    }
                                })


                                const newValues = {
                                    $set: {
                                        drafts: drafts
                                    }
                                }


                                db.collection('users').updateOne({_id: userdata._id}, newValues).then(function(e, r) {
                                    res.send(JSON.stringify(meme, null, 4))
                                })

                            })
                        })
                    })
                } else {
                    await db.collection('drafts').updateOne({_id: ObjectID(req.params.id)}, {$set: meme}).then(function (e, r) {
                        res.send(JSON.stringify(meme, null, 4))
                    })
                }
            })
        })
    } else {
        sendResponse(res, ResponseType.ERROR, "Could not create meme! Make sure to login.")
    }
})

app.get('/draft', async function(req, res){
    const db = req.app.get('db')
    
    await db.collection('drafts').find({}).toArray(function (err, drafts) {
            res.send(JSON.stringify(drafts, null, 4))
    })
})

app.get('/draft/user', async function(req, res){
    const db = req.app.get('db')
    
    await db.collection('users').find({}).toArray(function (err, drafts) {
            res.send(JSON.stringify(drafts, null, 4))
    })
})

app.delete('/draft', async function(req, res){
    const db = req.app.get('db')

    await db.collection('drafts').deleteMany({}).then(function(r){
        res.send(r)
    })
})



/**
 * reads memes from database matching query, sort and options
 */
app.get('/meme', async function (req, res) {
    const db = req.app.get('db')
    let query = JSON.parse(req.query.q)
    let searchstr
    let filterstr
    if (query.hasOwnProperty('_id')) {
        if (query._id.hasOwnProperty('$lt')){
            query._id.$lt = ObjectID(query._id.$lt)
            query = {
                _id: query._id,
                visibility: "public"
            }
        } else if (query._id.hasOwnProperty('$gt')){
            query._id.$gt = ObjectID(query._id.$gt)
            query = {
                _id: query._id,
                visibility: "public"
            }
        } else if(query._id.hasOwnProperty('$in')) {
            query._id.$in = query._id.$in.map(meme => ObjectID(meme))
        } else {
            query._id = ObjectID(query._id)
        }
    } else {
        query = {
            visibility: "public"
        }
    }
    const options = JSON.parse(req.query.o)
    const sort = req.query.s ? JSON.parse(req.query.s) : {}

    if (req.query.fu) {
        searchstr = new RegExp(JSON.parse(req.query.fu), 'i')
        query = {$or:[{title: searchstr}, {tags:searchstr}], visibility: "public"} 
    }

    if (req.query.fi) {
        filterstr = new RegExp(JSON.parse(req.query.fi), 'i')
        if (req.query.fu) {
            query = {title:searchstr, url:filterstr, visibility: "public"} //{title: /mein/i}, {url: /png/i}
        }
    }

    await db.collection('memes').find(query, options).sort(sort)
        .toArray(function (err, memes) {
            res.send(JSON.stringify(memes, null, 4))
        })
})

/**
 * reads drafts from database matching query, sort and options
 */
 app.get('/drafts', async function (req, res) {
    const db = req.app.get('db')
    let query = JSON.parse(req.query.q)
    let searchstr
    let filterstr
    if (query.hasOwnProperty('_id')) {
        if (query._id.hasOwnProperty('$lt')){
            query._id.$lt = ObjectID(query._id.$lt)
            query = {
                _id: query._id,
                visibility: "public"
            }
        } else if (query._id.hasOwnProperty('$gt')){
            query._id.$gt = ObjectID(query._id.$gt)
            query = {
                _id: query._id,
                visibility: "public"
            }
        } else if(query._id.hasOwnProperty('$in')) {
            query._id.$in = query._id.$in.map(meme => ObjectID(meme))
        } else {
            query._id = ObjectID(query._id)
        }
    } else {
        query = {
            visibility: "public"
        }
    }
    const options = JSON.parse(req.query.o)
    const sort = req.query.s ? JSON.parse(req.query.s) : {}

    if (req.query.fu) {
        searchstr = new RegExp(JSON.parse(req.query.fu), 'i')
        query = {$or:[{title: searchstr}, {tags:searchstr}], visibility: "public"} 
    }

    if (req.query.fi) {
        filterstr = new RegExp(JSON.parse(req.query.fi), 'i')
        if (req.query.fu) {
            query = {title:searchstr, url:filterstr, visibility: "public"} //{title: /mein/i}, {url: /png/i}
        }
    }

    await db.collection('drafts').find(query, options).sort(sort)
        .toArray(function (err, memes) {
            res.send(JSON.stringify(memes, null, 4))
        })
})

app.post('/createMemes', async function (req, res) {

    const db = req.app.get('db')

    let meme = req.body
    let url = req.body.url
    let filepaths =[]
    let memes = []

    var zip = new AdmZip();
    var content = "Dogs are better than cats.";
    zip.addFile("README.txt", Buffer.alloc(content.length, content), "");

    extension = "." +  url.split('.').pop();
    meme.text.forEach(c => {  filepaths.push('./memes/' + c.title + extension)})
    memes = meme.text

    response = []

    for (let i = 0; i < memes.length; i++) {
        await memeGenerator.generateMeme({
                    topText: memes[i].topText,
                    topX: memes[i].topX,
                    topY: memes[i].topY,
                    bottomText: memes[i].bottomText,
                    bottomX: memes[i].bottomX,
                    bottomY: memes[i].bottomY,
                    url: url
            
        }).then(function (data) {

            fs.writeFile(filepaths[i], data, async function (err, result) {
                if (err) return res.status(400).json({error: err})
                fileName = filepaths[i]

                memes[i].url = memeBaseUrl + memes[i].title + extension
                memes[i]._id = new ObjectID()
                memes[i].description = memes[i].description
                memes[i].votes = 0
                memes[i].views = 0
                memes[i].comments = []
                memes[i].date = new Date(Date.now()).toISOString()

                await db.collection('memes').insertOne(memes[i], function (err, r) {
                    if (err) response.push({error: err}) 
                    response.push({
                        _id: memes[i]._id,
                        url: memes[i].url
                    })

                    if (i == memes.length-1){
                        filepaths.map(path => {
                            zip.addLocalFile(path)
                            zip.writeZip("./zips/files.zip")
                        })         
                    }
                })
            })
        })
      }

    res.writeHead(302, {'Location': '/zips/files.zip'});
    //res.json(response)
    res.end();
})

/**
 * gets a random meme
 */
app.get('/meme/random', async function (req, res) {
    const db = req.app.get('db')
    const agg = db.collection('memes').aggregate([
        {$sample:{size:1}}
    ])
    const meme = await agg.toArray(function(err, meme) {
        if (err) throw err
        res.send(JSON.stringify(meme[0], null, 4))
    })
})

/**
 * reads meme by id
 */
app.get('/meme/:id', async function (req, res) {
    const db = req.app.get('db')
    const id = ObjectID(req.params.id)
    const query = {_id: id}

    await db.collection('memes').findOne(query).then(function (meme) {

        const newValues = { 
            $inc: {views: 1},
            $push: {
                voteData: {
                    timestamp: new Date(Date.now()).toISOString(),
                    views: meme.views
                }
            }
         }
    
        db.collection('memes').updateOne(query, newValues, function(err, response) {
            db.collection('memes').findOne(query).then(function (meme) {
                res.send(JSON.stringify(meme, null, 4))
            })
        })
    })
})

/**
 * API for downloading a set of images as a zip file using search parameters
 * If the max. images is not specified, a maximum of 100 are retrieved
 *
 * example testings for now:
 * http://localhost:3007/downloads?q={}&o={"limit":3,"skip":0,"sort":{"_id":-1}}&s={}&fu="now"&fi={}
 * http://localhost:3007/downloads?&fu="vodafone"&fi="png"
 *
 */
app.get('/downloads', async function(req, res) {

    const db = req.app.get('db')
    let searchstr, filterstr
    let localPath
    let query, options, sort = {}

    if (req.query.o) options = JSON.parse(req.query.o)
    else options = {"limit":100,"skip":0,"sort":{"_id":-1}}
    if (req.query.q) query = JSON.parse(req.query.q)
    if (req.query.s) sort = JSON.parse(req.query.s)
    if (req.query.fu) {
        searchstr = new RegExp(JSON.parse(req.query.fu), 'i')
        query = {title: searchstr}
    }
    if (req.query.fi) {
        filterstr = new RegExp(JSON.parse(req.query.fi), 'i')
        if (req.query.fu) query = {title:searchstr, url:filterstr}
    }

    await db.collection('memes').find(query, options).sort(sort)
        .toArray(function (err, memes) {

            localPath = memes.map(b => b.url.replace(/http:\/\/localhost:3007/g, '.'))
            var zip = new AdmZip();
            var content = "Dogs are better than cats.";
            zip.addFile("README.txt", Buffer.alloc(content.length, content), "");
            localPath.map(a => zip.addLocalFile(a))
            zip.writeZip("./zips/files.zip");
           })

    res.writeHead(302, {'Location': '/zips/files.zip'});
    res.end();
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

/**
 * deletes meme by id
 */
 app.delete('/draft/:id', async function(req, res) {
    const db = req.app.get('db')
    await db.collection('drafts').deleteOne({_id: ObjectID(req.params.id)}, function(err, obj) {
        if (err) return res.sendStatus(404)
        res.sendStatus(200)
    })
})

app.post('/login', async function(req, res) {
    const db = req.app.get('db')
    const username = req.body.user
    const plainpw = req.body.pw

    await db.collection('users').findOne({username: username}).then(function (userdata) {
        if(userdata){
            const encpw = PBKDF2(plainpw, userdata.salt, {keySize: 16,  iterations:1000})
            if(userdata.pw == encpw) {
                const api_key = ""+SHA256(WordArray.random(64))
                const data = {
                    _id: userdata._id,
                    username: userdata.username,
                    memes: userdata.memes,
                    votes: userdata.votes,
                    api_cred: ""+api_key
                }

                // Create Authentication object and enter it into db for access control
                const auth = {
                    _id: new ObjectID(),
                    date: new Date(Date.now()).toISOString(),
                    userid: userdata._id,
                    cred: ""+ api_key
                }

                db.collection('authentication').insertOne(auth, function (err, r) {
                    if (err) return res.status(400).json({error: err})
                    res.send(JSON.stringify({status: "OK", data: data}, null, 4))
                })
            } else {
                res.send(JSON.stringify({status: "Error: Wrong login", data: {}}, null, 4))
            }
        } else {
            res.send(JSON.stringify({status: "Error: Wrong login", data: {}}, null, 4))
        }
    })
})

app.post('/register', async function(req, res) {
    const db = req.app.get('db')
    const username = req.body.user
    const plainpw = req.body.pw
    const salt = ""+SHA256(WordArray.random(64))
    const encpw = ""+PBKDF2(plainpw, salt, {keySize: 16,  iterations:1000})

    const data = {
        _id: new ObjectID(),
        username: username,
        salt: salt,
        pw: encpw,
        votes: [],
        memes: []
    }

    await db.collection('users').insertOne(data, function (err, r) {
        if (err) return res.status(400).json({error: err})
        res.send(JSON.stringify({status: "OK", data: data}, null, 4))
    })
})

/** Updates the userdata with the client */
app.post('/userdata', async function(req, res) {
    const db = req.app.get('db')
    const userid = req.body.id
    const cred = req.body.cred

    const hasPermission = isAutherized(db, userid, cred)

    if(hasPermission) {
        await db.collection('users').findOne({_id: ObjectID(userid)}).then(function(userdata) {
            createUserdata(userdata, cred).then(function(data){
                res.send(JSON.stringify({status: "OK", data: data}, null, 4))
            })
        })
    } else {
        res.send(JSON.stringify({status: "ERROR", text:"User not authorized!"}, null, 4))
    }
})

app.get('/auth/delete', async function (req, res) {
    const db = req.app.get('db')
    await db.collection('authentication').deleteMany({}).then(function(r){
        res.send(r)
    })

})

app.get('/auth', async function (req, res) {
    const db = req.app.get('db')
    await db.collection('authentication').findOne({}).then(function (meme) {
        res.send(JSON.stringify(meme, null, 4))
    })
})

app.post('/logout', async function(req, res) {
    const db = req.app.get('db')
    const userID = req.body.id
    const userCred = req.body.cred

    await db.collection('authentication').deleteOne({userid: ObjectID(userID)}, function(err, obj) {
        if (err) return res.sendStatus(404)
        res.send(JSON.stringify({status: "OK", text:"User logged out!"}, null, 4))
    })

})

async function sendResponse(response, type = 0, message = "" , data = []) {
    switch(type) {
        case 0: // Data response
            response.send(JSON.stringify({status: "OK", text: message, data: data}))
            break
        case 1: // Error response
            response.send(JSON.stringify({status: "ERROR", text: message, data: data}))
            break
    }
}

async function findVote(votes, memeid) {
    return votes.find(v => v.memeid == memeid)
}


async function isAutherized(db, userid, cred) {
    const query = {userid: ObjectID(userid)}
    var authorized = false
    await db.collection('authentication').findOne(query).then(function (auth) {
        authorized = (auth.cred == cred)
    })
    return authorized
}

async function createUserdata(user, cred) {
    const userdata = {
        _id: user._id,
        username: user.username,
        api_cred: cred,
        votes: user.votes,
        memes: user.memes,
        drafts: user.drafts,
        comments: user.comments
    }
    return userdata
}