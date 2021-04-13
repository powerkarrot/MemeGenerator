const fs = require('fs')
const ObjectID = require('mongodb').ObjectID
const auth = require("./authentication")
const helper = require("./helper")

/**
 * loads all files in the uploads path
 * @param {*} req 
 * @param {*} res 
 */
async function loadAllTemplates(req, res) {
    fs.readdir(__dirname + '/uploads', function (err, fileNames) {
        if (err) return res.status(400).json({error: err})
        res.send(JSON.stringify(fileNames, null, 4))
    })
}

/**
 * Upserts a template and increments views
 * @param {*} req 
 * @param {*} res 
 */
async function upsertTemplate(req, res) {
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
}

/**
 * Updates template description
 * @param {*} req 
 * @param {*} res 
 */
async function updateTemplateDescription(req, res){
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
}

/**
 * Updates template generated count
 * @param {*} req 
 * @param {*} res 
 */
async function updateTemplateGenCount(req, res) {
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
}

/**
 * Updates template votes
 * @param {*} req 
 * @param {*} res 
 */
async function updateVote(req, res) {
    const db = req.app.get('db')
    const votes = req.body.vote < 0 ? -1 : 1
    const isPositive = votes > 0 ? true : false
    const userid = req.body.userid
    const cred = req.body.cred
    const query = { _id: ObjectID(req.params.id) }

    const hasPermission = auth.isAutherized(db, userid, cred)

    let votesInc = votes 
    let gen = 0
    let date = new Date(Date.now()).toISOString()

    if(hasPermission) {
        db.collection('templates').findOne(query, function(err, meme) {

            if (err) {
                helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
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
    
                                        db.collection('users').updateOne({_id: ObjectID(userid)}, newValues, function(err, resu){
                                            if (err) {
                                                helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
                                            } else {
                                                
                                                res.send(result.value)

                                            }
                                        })
                                    }
                                })
                            } else {
                                helper.sendResponse(res, helper.ResponseType.ERROR, "User already voted!")
                            }
    
                        //User hasn't voted yet
                        } else {
                            db.collection('templates').findOneAndUpdate(query, newValues, {returnOriginal:false},function(err, result) {
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
    
                                    db.collection('users').updateOne({_id: ObjectID(userid)}, newValues, function(err, resu){
                                        if (err) {
                                            helper.sendResponse(res, helper.ResponseType.ERROR, "Database failure!")
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
        helper.sendResponse(res, helper.ResponseType.ERROR, "User not authorized!")
    }
}

module.exports = { loadAllTemplates, upsertTemplate, updateTemplateDescription, updateTemplateGenCount, updateVote };