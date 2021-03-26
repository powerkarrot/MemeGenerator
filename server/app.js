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
            meme.date = new Date(Date.now()).toISOString()
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
                // Funktioniert nicht :(
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
        memes: user.memes
    }
    return userdata
}