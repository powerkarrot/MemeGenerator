const ObjectID = require('mongodb').ObjectID
const auth = require("./authentication")
const helper = require("./helper")
const puppeteer = require('puppeteer'); 
const memeLib = require('./meme-generator')
const fs = require('fs')
var ffmpeg = require('fluent-ffmpeg');
var AdmZip = require("adm-zip");
const memeBaseUrl = 'http://localhost:3007/memes/'

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
 * creates a meme and gives it an id
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function createMeme(req, res) {
    const db = req.app.get('db')
    let meme = req.body, url, fileName
    const uploads = await upload(req.files)
    const userid = ObjectID(req.body.userid)
    const cred = req.body.cred
    const draft = req.body.draft
    let userdata = {_id: userid, username: req.body.username}
    const hasPermission = auth.isAutherized(db, userid, cred)

    if(!req.body.cred && !req.body.userid && !req.body.username) {
        console.log("Malformed request body!")
        sendResponse(res, helper.ResponseType.ERROR, "Malformed request body!")
        return
    }

    if(hasPermission) {
        const memeid = new ObjectID()
        const uploads = await upload(req.files)
        let generateMeme = meme.url ? true : false
        console.log("GenerateMeme: ", generateMeme)
        //if (meme.url == undefined) generateMeme = false
        if (uploads.length > 0) {
            url = uploads[0].fullPath
            fileName = uploads[0].fileName.split('.')
            const fileEnd = fileName[fileName.length - 1]
            fileName = memeid + "." + fileEnd

        } else {
            if (generateMeme) {
                url = meme.url
                console.log("URL: ", url)
                fileName = url.split('.')
                const fileEnd = fileName[fileName.length - 1]
                fileName = memeid + "." + fileEnd
            }
        }
        if(generateMeme) {
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
                thirdText: meme.thirdText,
                thirdSize: meme.thirdSize,
                thirdX: meme.thirdX,
                thirdY: meme.thirdY,
                thirdBold: meme.thirdBold,
                thirdItalic: meme.thirdItalic,
                thirdColor: meme.thirdColor,
                url: url
            }).then(function (data) {
                console.log("FileName: ", fileName)
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
        }

    } else {
        helper.sendResponse(res, helper.ResponseType.ERROR, "Could not create meme! Make sure to login.")
    }
}

/**
 * updates a meme with a certain id
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateMeme(req, res) {
    const db = req.app.get('db')
    let meme = req.body, url, fileName
    const userid = req.body.userid
    const cred = req.body.cred
    const tags = JSON.parse(req.body.tags)
    const draft = req.body.draft
    let userdata = {_id: userid, username: req.body.username}

    const hasPermission = auth.isAutherized(db, userid, cred)

    if(!req.body.cred && !req.body.userid && !req.body.username) {
        console.log("Malformed request body!")
        helper.sendResponse(res, helper.ResponseType.ERROR, "Malformed request body!")
        return
    }

    if(hasPermission) {
        let generateMeme = meme.url ? true : false
        const uploads = await upload(req.files)
        if (uploads.length > 0 && !meme.url) {
            url = uploads[0].fullPath
            fileName = uploads[0].fileName.split('.')
            const fileEnd = fileName[fileName.length - 1]
            fileName = ObjectID(req.params.id) + "." + fileEnd
        } else {
            console.log("Template: ", meme.template)
            if (generateMeme) {
                url = meme.url
                fileName = url.split('.')
                const fileEnd = fileName[fileName.length - 1]
                fileName = ObjectID(req.params.id) + "." + fileEnd
            }
        }
        if (generateMeme) {
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
                thirdText: meme.thirdText,
                thirdSize: meme.thirdSize,
                thirdX: meme.thirdX,
                thirdY: meme.thirdY,
                thirdBold: meme.thirdBold,
                thirdItalic: meme.thirdItalic,
                thirdColor: meme.thirdColor,
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
                                        helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
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
        }
    } else {
        helper.sendResponse(res, helper.ResponseType.ERROR, "Could not create meme! Make sure to login.")
    }
}

/**
 * Post a comment on a meme
 * @param {*} req 
 * @param {*} res 
 */
async function commentMeme(req, res) {
    const db = req.app.get('db')
    const query = {_id: ObjectID(req.params.id)}
    const userid = req.body.userid
    const username = req.body.username
    const cred = req.body.cred
    const comment = req.body.comment

    const hasPermission = auth.isAutherized(db, userid, cred)

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

}

/**
 * Add tags to a meme
 * @param {*} req 
 * @param {*} res 
 */
async function tagMeme(req, res) {
    const db = req.app.get('db')
    const tags = req.body.tags
    const query = {_id: ObjectID(req.params.id)}
    const userid = req.body.userid
    const cred = req.body.cred

    const hasPermission = auth.isAutherized(db, userid, cred)

    if(hasPermission) {
        const newValues = { 
            $push: {
                tags: tags
            }
        }

        await db.collection('memes').updateOne(query, newValues, function(err, result){
            if(err) helper.sendResponse(res, helper.ResponseType.ERROR, "Failed to commit tag!")
            helper.sendResponse(res, helper.ResponseType.DATA, "Successfully commited tag!")
        })
    } else {
        helper.sendResponse(res, helper.ResponseType.ERROR, "User not authorized!")
    }
}

/**
 * Vote for a meme
 * @param {*} req 
 * @param {*} res 
 */
async function voteMeme(req, res) {
    const db = req.app.get('db')
    const votes = req.body.vote < 0 ? -1 : 1
    const isPositive = votes > 0 ? true : false
    const userid = req.body.userid
    const cred = req.body.cred
    const query = { _id: ObjectID(req.params.id) }

    const hasPermission = auth.isAutherized(db, userid, cred)

    if(hasPermission) {
        db.collection('memes').findOne(query, function(err, meme) {

            if (err) {
                helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
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
                    helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
                }
                const votes = userdata.votes
                if(votes) {
                    helper.findVote(votes, req.params.id).then((vote) => {
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
                                        helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
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
                                                helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
                                            } else {
                                                helper.sendResponse(res, helper.ResponseType.DATA, "Successfully voted!")
                                            }
                                        })
                                    }
                                })
                            } else {
                                helper.sendResponse(res, helper.ResponseType.ERROR, "User already voted!")
                            }
    
                        //User hasn't voted yet
                        } else {
                            db.collection('memes').updateOne(query, newValues, function(err, result) {
                                if (err) {
                                    helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
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
                                            helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
                                        } else {
                                            helper.sendResponse(res, helper.ResponseType.DATA, "Successfully voted!")
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
        helper.sendResponse(res, helper.ResponseType.ERROR, "User not authorized!")
    }
}

/**
 * reads memes from database matching query, sort and options
 * @param {*} req 
 * @param {*} res 
 */
async function getMeme(req, res) {
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
}

/**
 * Gets a random meme from the database
 * @param {*} req 
 * @param {*} res 
 */
async function getRandomMeme(req, res) {
    const db = req.app.get('db')
    const agg = db.collection('memes').aggregate([
        {$sample:{size:1}}
    ])
    const meme = await agg.toArray(function(err, meme) {
        if (err) throw err
        res.send(JSON.stringify(meme[0], null, 4))
    })
}

/**
 * reads meme by id
 * @param {*} req 
 * @param {*} res 
 */
async function getMemeByID(req, res) {
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
}

/**
 * Deletes a meme by ID
 * @param {*} req 
 * @param {*} res 
 */
async function deleteMemeByID(req, res) {
    const db = req.app.get('db')
    await db.collection('memes').deleteOne({_id: ObjectID(req.params.id)}, function(err, obj) {
        if (err) return res.sendStatus(404)
        res.sendStatus(200)
    })
}

/**
 * Deletes a draft by ID
 * @param {*} req 
 * @param {*} res 
 */
async function deleteDraftByID(req, res) {
    const db = req.app.get('db')
    const userid = req.body.userid
    const cred = req.body.cred
    const draftID = ObjectID(req.params.id)

    if(userid && cred){
        const hasPermission = auth.isAutherized(db, userid, cred)

        if (hasPermission) {
            await db.collection('drafts').deleteOne({_id: draftID}, function(err, obj) {
                if (err) return res.sendStatus(404)
        
                db.collection('users').findOne({_id: ObjectID(userid)}, function(err, userdata) {
                    if (err) {
                        helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
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
                        helper.sendResponse(res, helper.ResponseType.DATA, "Success")
                    })
                })
            })
        } else {
            helper.sendResponse(res, helper.ResponseType.ERROR, "Could not delete meme! Make sure to login.")
        }
    } else {
        console.log("Userid: ", userid)
        console.log("cred: ", cred)
        helper.sendResponse(res, helper.ResponseType.ERROR, "Too few parameters")
    }
}

/**
 * Gets user generated drafts
 * @param {*} req 
 * @param {*} res 
 */
async function getDraftForUser(req, res) {
    const db = req.app.get('db')
    
    await db.collection('users').find({}).toArray(function (err, drafts) {
            res.send(JSON.stringify(drafts, null, 4))
    })
}

/**
 * API for downloading a set of images as a zip file using search parameters
 * If the max. images is not specified, a maximum of 100 are retrieved
 *
 * example testings for now:
 * http://localhost:3007/downloads?q={}&o={"limit":3,"skip":0,"sort":{"_id":-1}}&s={}&fu="now"&fi={}
 * http://localhost:3007/downloads?&fu="vodafone"&fi="png"
 * @param {*} req 
 * @param {*} res 
 */
async function getMemesAsZip(req, res) {
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
}

/**
 * Function to create multiple memes with different text options
 * @param {*} req 
 * @param {*} res 
 */
async function createMultipleMemes(req, res) {
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
    res.end();
}

/**
 * reads drafts from database matching query, sort and options
 * @param {*} req 
 * @param {*} res 
 */
async function getDrafts(req, res) {
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
}

/**
 * Creates a screenshot from a given url and returns a template
 * @param {*} req 
 * @param {*} res 
 */
async function createScreenshot(req, res) {
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
}

/**
 * handles file uploads
 * @param {*} files 
 * @returns 
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
 * Streams a video 
 * Adapted from:
 * https://dev.to/abdisalan_js/how-to-stream-video-from-mongodb-using-nodejs-4ibi 
 * @param {*} req 
 * @param {*} res 
 */
async function streamVideo(req, res) {
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
}

/**
 * Converts single Image to a Video
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
 * Testing function to delete all drafts created
 * @param {*} req 
 * @param {*} res 
 */
 async function deleteAllDrafts(req, res) {
    const db = req.app.get('db')

    await db.collection('drafts').deleteMany({}).then(function(r){
        res.send(r)
    })
}

/**
 * Testing function to get all drafts created
 * @param {*} req 
 * @param {*} res 
 */
async function getAllDrafts(req, res) {
    const db = req.app.get('db')
    
    await db.collection('drafts').find({}).toArray(function (err, drafts) {
            res.send(JSON.stringify(drafts, null, 4))
    })
}


module.exports = { createMeme, commentMeme, tagMeme, voteMeme, updateMeme, getMeme, getRandomMeme, getMemeByID, getAllDrafts,
    deleteMemeByID, deleteDraftByID, getDraftForUser, deleteAllDrafts, getMemesAsZip, getDrafts, createMultipleMemes, createScreenshot,
    streamVideo,  };