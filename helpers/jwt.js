
const {expressjwt: expressJwt} = require('express-jwt');
const dotenv = require("dotenv");
dotenv.config();


function authJwt() {
    const secret = process.env.secret;
    const api = process.env.API_URL;
    
    return expressJwt({
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [
            {url: /\/uploads(.*)/ , methods: ['GET', 'OPTIONS'] },
            {url: /\/api\/v1\/products(.*)/ , methods: ['GET', 'OPTIONS'] },
            {url: /\/api\/v1\/categories(.*)/ , methods: ['GET', 'OPTIONS'] },
            {url: /\/api\/v1\/videos(.*)/ , methods: ['GET', 'OPTIONS'] },
            `${api}/users/login`,
            `${api}/users/register`,
            `${api}/admin/register`,
            `${api}/admin/login`,
        ]
    })
}

async function isRevoked(req, payload, done){
    if(!payload.isAdmin){
        done(null, true)
    }

    done();
}

module.exports = authJwt;