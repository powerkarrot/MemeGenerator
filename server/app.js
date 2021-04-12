const express = require('express')
const SHA256 = require("crypto-js/sha256")
const PBKDF2 = require("crypto-js/pbkdf2")
const WordArray = require("crypto-js/lib-typedarrays")
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const puppeteer = require('puppeteer'); 
const memeLib = require('./meme-generator')
const fs = require('fs')
var ffmpeg = require('fluent-ffmpeg');
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
app.use('/videos', express.static(__dirname + '/videos'))



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

/**
 * Converts single Image to a Video
 * 
 * @param {*} req 
 */
function convertSingle() {

    let saveTo = __dirname + '/videos/' + new ObjectID() + '.mp4'
    let command = ffmpeg()
    command
    .input('http://localhost:3007/memes/test5.jpg')
    .inputFPS(2)
    .outputFPS(30)
    .videoCodec('libx264')
    .videoBitrate(1024)
    .size('640x?')
    .loop(4)
    .noAudio()
    .save(saveTo)
}

/**
 * Streams a video 
 * Adapted from:
 * https://dev.to/abdisalan_js/how-to-stream-video-from-mongodb-using-nodejs-4ibi
 * 
 */
app.get("/video", function (req, res) {

    // Check for range headers to find start time
    const range = req.headers.range
    if (!range) {
      res.status(400).send("Requires Range header")
    }

     // converts single meme to video on connection start
     if(range == 'bytes=0-') {
        convertSingle()
   }


    //Streams a test video
    const videoPath =  __dirname + '/videos/' + 'videotest.mp4'

    // Create response headers
    const videoSize = fs.statSync(videoPath).size
    const CHUNK_SIZE = 10 ** 6; //  1MB chunks
    const start = Number(range.replace(/\D/g, ""))
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1)
  
    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    }
  
    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers)
   
    const videoStream = fs.createReadStream(videoPath, { start, end })
  
    //Pipe video to response
    videoStream.pipe(res)

  })

/**
 * Handles screenshots
 */
app.post('/screenshot', async function (req, res) {
    
    url = req.body.url

    let browser = await puppeteer.launch({ headless: true,  args: ['--no-sandbox']})
    let page = await browser.newPage()
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 })
    await page.setViewport({ width: 1024, height: 800 })
    
    //let title = url.replace(/(^\w+:|^)\/\//, '')
    let title = JSON.stringify(new ObjectID())
    let name = url.split(/[\\\/]/).pop().split(".").shift()

    filepathname = __dirname + '/uploads/' + title + '.jpg'
    
    await page.screenshot({
     path: filepathname,
     type: "jpeg",
     fullPage: true
   })
   
   await page.close();
   await browser.close();
   console.log(JSON.stringify(filepathname))

   data = {
       path : title + '.jpg',
       url : "http://localhost:3007/uploads/" + title + '.jpg',
       title: name
   }
   res.send(JSON.stringify(data))
})

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
 * Upserts a template and increments views
 */
 app.post('/template', async function (req, res) {

    const db = req.app.get('db')
    const template = req.body
    query = {url : JSON.stringify(req.body.url)}
    
    //Regex adapted from :https://stackoverflow.com/a/55975214
    const title = template.url.split(/[\\\/]/).pop().split(".").shift()
    let date = new Date(Date.now()).toISOString()
    viewsInc = 1
    gen = 0
    v = 0

    db.collection('templates').findOne(query, function(err, t) {
        if(t != null) {
            viewsInc = t.views + 1
            gen =  (t.generated === undefined || t.generated === null) ? 0 : t.generated
            v = (t.votes === undefined || t.votes === null) ? 0 : t.votes
        }

        db.collection('templates').findOneAndUpdate(
        //filter
        { "url" : JSON.stringify(template.url) },
            //update or create
        {                                        
            $set:{ 
                "url" : JSON.stringify(template.url) ,
                "title": title,
            },
            $inc: {
                "views" : 1 
            },
            $push: {
                viewData: {
                    timestamp: date,
                    views: viewsInc
                },
                voteData: {
                    timestamp: date,
                    votes: v
                },
                generatedData: {
                    timestamp: date,
                    generated: gen
                }
            }
        },
        //options
        { upsert:true, returnOriginal:false }, function(err, ret) {
            res.send(JSON.stringify(ret.value))
        }) 
    }) 
})


/**
 * Updates template description
 * 
 */
app.post('/template/description', async function (req, res) {

    const db = req.app.get('db')
    const template = req.body

    await db.collection('templates').findOneAndUpdate(
        //filter
        { "url" : JSON.stringify(template.url) },
         //update
        {                                        
            $set:{ 
                "description" : template.description ,
            }
        },
        //options
        { upsert:true, returnOriginal:false }) 
        .then(function(template) {  
            res.send(JSON.stringify(template.value))
    })
})

/**
 * Updates template generated count
 */
app.post('/template/generated', async function (req, res) {

    const db = req.app.get('db')
    const template = req.body
    generatedInc = (template.generated === undefined || template.generated === null) ? 0 : (template.generated + 1)
    v = (template.votes === undefined || template.votes === null)? 0 : template.votes

    let date = new Date(Date.now()).toISOString()

    await db.collection('templates').findOneAndUpdate(
        //filter
        { "url" : JSON.stringify(template.url) },
         //update 
        {                                        
            $inc: {
                generated : 1 ,
            },
            $push: {
                viewData: {
                    timestamp: date,
                    views: template.views
                },
                voteData: {
                    timestamp: date,
                    votes: v
                },
                generatedData: {
                    timestamp: date,
                    generated: generatedInc
                }
            }
        },
        // return new document
        { upsert:true, returnOriginal:false }) 
        .then(function(template) {  
            res.send(JSON.stringify(template.value))
    })
})

/**
 * Updates template votes
 */
app.post('/template/vote/:id', async function(req, res) {
    const db = req.app.get('db')
    const votes = req.body.vote < 0 ? -1 : 1
    const isPositive = votes > 0 ? true : false
    const userid = req.body.userid
    const cred = req.body.cred
    const query = { _id: ObjectID(req.params.id) }

    const hasPermission = isAutherized(db, userid, cred)

    let votesInc = votes 
    let gen = 0
    let date = new Date(Date.now()).toISOString()

    if(hasPermission) {
        db.collection('templates').findOne(query, function(err, meme) {

            if (err) {
                sendResponse(res, ResponseType.ERROR, "Database failure!")
            }
            gen = (meme.generated === undefined || meme.generated === null)? 0 : meme.generated


            var newValues = {
                $inc: {votes: votes},
                $push: {
                   voteData: {
                       timestamp: date,
                       votes: votesInc
                   },
                   viewData: {
                        timestamp: date,
                        views: req.body.template.views
                   },
                   generatedData: {
                        timestamp: date,
                        generated: gen
                   }
               }
           }

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
                                    newValues = { 
                                        $inc: {votes: 2} ,
                                        $push: {
                                            voteData: {
                                                timestamp: new Date(Date.now()).toISOString(),
                                                votes: meme.votes + 2
                                            },
                                            viewData: {
                                                timestamp: new Date(Date.now()).toISOString(),
                                                views: req.body.template.views
                                            },
                                            generatedData: {
                                                timestamp: new Date(Date.now()).toISOString(),
                                                generated: gen
                                           }
                                        }
                                    }
    
                                } else {
                                    newValues = {
                                         $inc: {votes: -2},
                                         $push: {
                                            voteData: {
                                                timestamp: new Date(Date.now()).toISOString(),
                                                votes: meme.votes - 2
                                            },
                                            viewData: {
                                                timestamp: new Date(Date.now()).toISOString(),
                                                views: req.body.template.views
                                            },
                                            generatedData: {
                                                timestamp: new Date(Date.now()).toISOString(),
                                                generated: gen
                                           }
                                        }
                                    }
                                }    
    
                                db.collection('templates').findOneAndUpdate(query, newValues, {returnOriginal:false}, function(err, result) {
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
                                            $set: {votes: votes}
                                        }
    
                                        db.collection('users').updateOne({_id: ObjectID(userid)}, newValues, function(err, resu){
                                            if (err) {
                                                sendResponse(res, ResponseType.ERROR, "Database failure!")
                                            } else {
                                                
                                                res.send(result.value)

                                            }
                                        })
                                    }
                                })
                            } else {
                                sendResponse(res, ResponseType.ERROR, "User already voted!")
                            }
    
                        //User hasn't voted yet
                        } else {
                            db.collection('templates').findOneAndUpdate(query, newValues, {returnOriginal:false},function(err, result) {
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
    
                                    db.collection('users').updateOne({_id: ObjectID(userid)}, newValues, function(err, resu){
                                        if (err) {
                                            sendResponse(res, ResponseType.ERROR, "Database failure!")
                                        } else {
                                            res.send(result.value)
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        })
        
    } else {
        sendResponse(res, ResponseType.ERROR, "User not authorized!")
    }
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

                let name = url.split("/").pop()
                meme.template = "http://localhost:3007/uploads/" + name
                //meme.template = url
                meme.voteData = [{
                    timestamp: new Date(Date.now()).toISOString(),
                    votes: 0
                }]
                meme.viewData = [{
                        timestamp: new Date(Date.now()).toISOString(),
                        views: 0
                }]

                const data = {
                    memeid: ObjectID(meme._id)
                }

                if(draft == "false") {

                    const newValues = {
                        $push: {
                            memes: data
                        }
                    }
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
                            res.json({
                                _id: meme._id,
                                url: meme.url,
                                template: meme.template
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

    const hasPermission = isAutherized(db, userid, cred)

    if(hasPermission) {
        db.collection('memes').findOne(query, function(err, meme) {

            if (err) {
                sendResponse(res, ResponseType.ERROR, "Database failure!")
            }

            var newValues = {
                $inc: {votes: votes},
                $push: {
                   voteData: {
                       timestamp: new Date(Date.now()).toISOString(),
                       votes: meme.votes + votes 
                   }
               }
           }

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
                                    newValues = { 
                                        $inc: {votes: 2} ,
                                        $push: {
                                            voteData: {
                                                timestamp: new Date(Date.now()).toISOString(),
                                                votes: meme.votes + 2
                                            }
                                        }
                                    }
    
                                } else {
                                    newValues = {
                                         $inc: {votes: -2},
                                         $push: {
                                            voteData: {
                                                timestamp: new Date(Date.now()).toISOString(),
                                                votes: meme.votes - 2
                                            }
                                        }
                                    }
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
                                            $set: {votes: votes}
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
    
                        //User hasn't voted yet
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
            url = meme.template
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
                        // Delete draft from db
                        db.collection('drafts').deleteOne({_id: ObjectID(req.params.id)}).then(function (e, r) {
                            db.collection('users').findOne({_id: ObjectID(userid)}, function(err, userdata) {
                                if (err) {
                                    sendResponse(res, ResponseType.ERROR, "Database failure!")
                                }

                                var drafts = userdata.drafts
                                var newDrafts = []

                                for(var i = 0; i < drafts.length; i++)
                                {   
                                    if(drafts[i].memeid != req.params.id) {
                                        newDrafts.push(drafts[i]);
                                    }
                                }

                                const newValues = {
                                    $set: {
                                        drafts: newDrafts
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

        let newValues = {}
        //this is a dumb hack but hey.
        //some older memes lack the viewData (votes kek) field.
        if(meme.voteData == undefined) {
            newValues = { 
                $inc: {views: 1},
                $push: {
                    viewData: {
                        timestamp: new Date(Date.now()).toISOString(),
                        views: meme.views
                    },
                    voteData: {
                        timestamp: new Date(Date.now()).toISOString(),
                        votes: meme.votes
                    }
                }
             }
        } else { 
            newValues = { 
            $inc: {views: 1},
                $push: {
                    viewData: {
                        timestamp: new Date(Date.now()).toISOString(),
                        views: meme.views
                    }
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
 app.post('/draft/delete/:id', async function(req, res) {
    const db = req.app.get('db')
    const userid = req.body.userid
    const cred = req.body.cred
    const draftID = ObjectID(req.params.id)

    if(userid && cred){
        const hasPermission = isAutherized(db, userid, cred)

        if (hasPermission) {
            await db.collection('drafts').deleteOne({_id: draftID}, function(err, obj) {
                if (err) return res.sendStatus(404)
        
                db.collection('users').findOne({_id: ObjectID(userid)}, function(err, userdata) {
                    if (err) {
                        sendResponse(res, ResponseType.ERROR, "Database failure!")
                    }

                    var drafts = userdata.drafts
                    var newDrafts = []

                    for(var i = 0; i < drafts.length; i++)
                    {   
                        if(drafts[i].memeid != req.params.id) {
                            newDrafts.push(drafts[i]);
                        }
                    }

                    const newValues = {
                        $set: {
                            drafts: newDrafts
                        }
                    }

                    db.collection('users').updateOne({_id: userdata._id}, newValues).then(function(e, r) {
                        sendResponse(res, ResponseType.DATA, "Success")
                    })
                })
            })
        } else {
            sendResponse(res, ResponseType.ERROR, "Could not delete meme! Make sure to login.")
        }
    } else {
        console.log("Userid: ", userid)
        console.log("cred: ", cred)
        sendResponse(res, ResponseType.ERROR, "Too few parameters")
    }
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
        if(auth)
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