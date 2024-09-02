const expressJwt = require("express-jwt");

const isRevoked = async (req, payload, done) => {
    if (!payload.isAdmin) {
        done(null, true);
    }
    done();
};

function authJwt() {
    const secret = process.env.secret;
    const api = process.env.API_URL;

    return expressJwt({
        secret,
        algorithms: ["HS256"],
        isRevoked,
    }).unless({
        path: [
                    { url: /\/api\/v1\/vendor-support-query(.*)/, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] },
            { url: /\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
            {
                url: /\/api\/v1\/products(.*)/,
                methods: ["GET", "PATCH", "POST", "OPTIONS", "PUT"],
            },
            { url: /\/api\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
            {
                url: /\/api\/v1\/videos(.*)/,
                methods: ["GET", "POST", "PATCH", "PUT", "OPTIONS"],
            },
            {
                url: /\/api\/v1\/address(.*)/,
                methods: ["GET", "POST", "DELETE", "OPTIONS", "PUT"],
            },
            {
                url: /\/api\/v1\/videocomments(.*)/,
                methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
            },
            {
                url: /\/api\/v1\/card(.*)/,
                methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
            },
            {
                url: /\/api\/v1\/orders(.*)/,
                methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
            },
            {
                url: /\/api\/v1\/bookmarks(.*)/,
                methods: ["POST", "GET", "DELETE", "OPTIONS"],
            },
            {
                url: /\/api\/v1\/users(.*)/,
                methods: ["POST", "GET", "PATCH", "PUT", "DELETE", "OPTIONS"],
            },
            {
                url: /\/api\/v1\/questions(.*)/,
                methods: ["POST", "GET", "DELETE", "PUT", "OPTIONS"],
            },
            {
                url: /\/api\/v1\/keywords(.*)/,
                methods: ["POST", "GET", "DELETE", "PUT", "OPTIONS"],
            },
            {
                url: /\/api\/v1\/recentlyViewed(.*)/,
                methods: ["POST", "GET", "DELETE"],
            },
            {
                url: /\/api\/v1\/canceledOrder(.*)/,
                methods: ["POST", "GET", "DELETE"],
            },
            {
                url: /\/api\/v1\/purchase(.*)/,
                methods: ["POST", "GET", "DELETE", "PUT"],
            },
            {
                url: /\/api\/v1\/vendor(.*)/,
                methods: ["POST", "GET", "PUT"],
            },
            {
                url: /\/api\/v1\/client(.*)/,
                methods: ["POST", "GET", "PUT", "DELETE"],
            },
            {
                url: /\/api\/v1\/returnBank(.*)/,
                methods: ["POST", "GET", "PUT", "DELETE"],
            },
            `${api}/users/login`,
            `${api}/users/register`,
            `${api}/admin/register`,
            `${api}/admin/login`,
        ],
    });
}

module.exports = authJwt;
