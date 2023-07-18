
const expressJwt = require('express-jwt');

function authJwt() {
    const secret = process.env.secret;
    const api = process.env.API_URL;
    
    return expressJwt({
        secret:secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [
            {url: /\/uploads(.*)/ , methods: ['GET', 'OPTIONS'] },
            {url: /\/api\/v1\/products(.*)/ , methods: ['GET','PATCH', 'OPTIONS'] },
            {url: /\/api\/v1\/categories(.*)/ , methods: ['GET', 'OPTIONS'] },
            {url: /\/api\/v1\/videos(.*)/ , methods: ['GET','POST','PATCH','PUT','OPTIONS'] },
            {url: /\/api\/v1\/address(.*)/ , methods: ['GET','POST','DELETE','OPTIONS'] },
            {url: /\/api\/v1\/videocomments(.*)/ , methods: ['GET','POST','DELETE','PUT','OPTIONS'] },
            {url: /\/api\/v1\/card(.*)/ , methods: ['GET','POST','DELETE','PUT','OPTIONS'] },
            {url: /\/api\/v1\/orders(.*)/ , methods: ['GET','POST','DELETE','PUT','OPTIONS'] },
            {url: /\/api\/v1\/bookmarks(.*)/ , methods: ['POST','GET','DELETE','OPTIONS'] },
            {url: /\/api\/v1\/users(.*)/ , methods: ['POST','GET','PATCH','PUT', 'DELETE','OPTIONS'] },
            {url: /\/api\/v1\/questions(.*)/ , methods: ['POST','GET','DELETE','PUT','OPTIONS'] },
            {url: /\/api\/v1\/keywords(.*)/ , methods: ['POST','GET','DELETE','PUT','OPTIONS'] },
            {url: /\/api\/v1\/mailer(.*)/ , methods: ['POST','GET','PUT','OPTIONS'] },
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