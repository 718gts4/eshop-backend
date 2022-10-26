
const {check, validationResult} = require('express-validator');

exports.validateRegisterRequest = [
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').isLength({ min: 6}).withMessage('Password must be at least 6 characters long')
];

exports.validateLoginRequest = [
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').isLength({ min: 6}).withMessage('Password must be at least 6 characters long')
];

exports.isRequestValidated = (req, res, next) => {
    const errors = validationResult(req);
    if(errors.array().length > 0){
        return res.status(400).json({error: errors.array()[0].msg})
    }

    next();
}