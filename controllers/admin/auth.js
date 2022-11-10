const {User} = require('../../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const { validationResult} = require('express-validator');


exports.register = async (req, res) => {
    const registerUser = await User.findOne({ email: req.body.email});
    if(registerUser)
    return res.status(400).json({
        message: 'Admin으로 등록된 이메일 주소입니다.'
    });

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: true,
        role: 'admin',
    })
    user = await user.save();

    if(!user)
    return res.status(400).send('the Admin cannot be created!')

    res.send(user);
}

exports.login = async (req, res) => {
    const user = await User.findOne({email: req.body.email})
    const secret = process.env.secret;
    if(!user) {
        return res.status(400).send('The user not found');
    }

    if(user && bcrypt.compareSync(req.body.password, user.passwordHash) && user.isAdmin) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin,
                role: user.role
            },
            secret,
            {expiresIn : '1d'}
        )
        const { _id, email, role, name, isAdmin} = user;
        res.status(200).json({
            token,
            user: { _id, email, role, name, isAdmin }
        })
    } else {
       res.status(400).send('Must be an Admin to login');
    }
   
}

exports.requestProfile = (req, res) => {
    res.status(200).json({user: req.user});
}
