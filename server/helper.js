
const ResponseType = {
    DATA: 0,
    ERROR: 1
}

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

/**
 * Helper function to filter out votes
 * @param {*} votes 
 * @param {*} memeid 
 * @returns 
 */
async function findVote(votes, memeid) {
    return votes.find(v => v.memeid == memeid)
}

module.exports = { sendResponse, findVote, ResponseType };