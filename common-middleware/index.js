const jwt = require('jsonwebtoken');

exports.requireSignin = (req, res, next) => {
    if(req.headers.authorization){
        const token = req.headers.authorization.split(" ")[1];
        const user = jwt.verify(token, process.env.secret);
        req.user = user;
    } else {
        return res.status(400).json({message: 'Authorization required'});
    }  
    next();
}

exports.userMiddleware = async (req, res, next) => {
    const adminUser = await req.user;
    if(adminUser.role !== 'user'){
        return res.status(400).json({ message: 'User access denied'})
    }

    next();
}

exports.adminMiddleware = async (req, res, next) => {
    const adminUser = await req.user;
    if(adminUser.isAdmin !== true){
        return res.status(400).json({ message: 'Admin access denied!'})
    }

    next();
}