const SHA256 = require("crypto-js/sha256")
const PBKDF2 = require("crypto-js/pbkdf2")
const WordArray = require("crypto-js/lib-typedarrays")
const ObjectID = require('mongodb').ObjectID

/**
 * User login
 * @param {*} req 
 * @param {*} res 
 */
async function login(req, res) {
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
}

/**
 * Registers a user
 * @param {*} req 
 * @param {*} res 
 */
async function register(req, res) {
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
}

/**
 * Updates the userdata with the client
 * @param {*} req 
 * @param {*} res 
 */
async function getUserdata(req, res) {
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
}

/**
 * Test function to manually delete a user authorization
 * @param {*} req 
 * @param {*} res 
 */
async function deleteAuthorization(req, res) {
    const db = req.app.get('db')
    await db.collection('authentication').deleteMany({}).then(function(r){
        res.send(r)
    })
}

/**
 * Test function to show authorizations
 * @param {*} req 
 * @param {*} res 
 */
async function authorize(req, res) {
    const db = req.app.get('db')
    await db.collection('authentication').findOne({}).then(function (meme) {
        res.send(JSON.stringify(meme, null, 4))
    })
}

/**
 * Logs a user out
 * @param {*} req 
 * @param {*} res 
 */
async function logout(req, res) {
    const db = req.app.get('db')
    const userID = req.body.id
    const userCred = req.body.cred

    await db.collection('authentication').deleteOne({userid: ObjectID(userID)}, function(err, obj) {
        if (err) return res.sendStatus(404)
        res.send(JSON.stringify({status: "OK", text:"User logged out!"}, null, 4))
    })
}

/**
 * Helper function checks if the user is authorized to use a route
 * @param {*} db 
 * @param {*} userid 
 * @param {*} cred 
 * @returns 
 */
 async function isAutherized(db, userid, cred) {
    const query = {userid: ObjectID(userid)}
    var authorized = false
    await db.collection('authentication').findOne(query).then(function (auth) {
        if(auth)
            authorized = (auth.cred == cred)
    })
    return authorized
}

/**
 * Helper function to create a userdata object
 * @param {*} user 
 * @param {*} cred 
 * @returns 
 */
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

module.exports = { login, logout, register, getUserdata, deleteAuthorization, authorize, isAutherized };