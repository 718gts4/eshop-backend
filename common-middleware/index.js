const jwt = require('jsonwebtoken');

const isDevelopment = process.env.NODE_ENV !== 'production';

exports.requireSignin = (req, res, next) => {
    if(req.headers.authorization){
        try {
            const token = req.headers.authorization.split(" ")[1];
            const user = jwt.verify(token, process.env.secret);
            req.user = user;
        } catch (error) {
            if (isDevelopment) {
                console.error('Token verification failed:', error.message);
            }
            return res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        if (isDevelopment) {
            console.log('Missing authorization header');
        }
        return res.status(401).json({ message: 'Authorization required' });
    }
    next();
}

exports.userMiddleware = (req, res, next) => {
    if(req.user.role !== 'user'){
        if (isDevelopment) {
            console.log('Access denied - not a user role');
        }
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}

exports.adminMiddleware = (req, res, next) => {
    if(req.user.isAdmin !== true && req.user.role !== 'superAdmin'){
        if (isDevelopment) {
            console.log('Access denied - not an admin/superadmin role');
        }
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}

exports.superAdminMiddleware = (req, res, next) => {
    if(req.user.role !== 'superAdmin'){
        if (isDevelopment) {
            console.log('Access denied - not a superadmin role');
        }
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}
