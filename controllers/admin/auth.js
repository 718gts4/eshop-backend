const { User } = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// const { validationResult} = require('express-validator');

exports.register = async (req, res) => {
    const registerUser = await User.findOne({ email: req.body.email });
    if (registerUser)
        return res.status(400).json({
            message: "Admin으로 등록된 이메일 주소입니다.",
        });

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: false,
        role: "admin",
    });
    user = await user.save();

    if (!user) return res.status(400).send("the Admin cannot be created!");

    res.send(user);
};

exports.login = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.secret;
    if (!user) {
        return res.status(400).send("The user not found");
    }
    const oneDayInSeconds = 60 * 60 * 24;
    if (
        user &&
        bcrypt.compareSync(req.body.password, user.passwordHash) &&
        user.role === "admin"
    ) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin,
                role: user.role,
                verified: user.verified,
            },
            secret,
            { expiresIn: oneDayInSeconds }
        );

        const {
            _id,
            email,
            role,
            name,
            isAdmin,
            image,
            username,
            following,
            followers,
            brand,
            brandDescription,
            link,
            phone,
            verified,
            submitted,
            adminVerified,
        } = user;
        res.status(200).json({
            token,
            user: {
                _id,
                email,
                role,
                name,
                isAdmin,
                image,
                username,
                following,
                followers,
                brand,
                brandDescription,
                link,
                phone,
                verified,
                submitted,
                adminVerified,
            },
        });
    } else {
        res.status(400).send("Must be an Admin to login");
    }
};

exports.requestProfile = (req, res) => {
    res.status(200).json({ user: req.user });
};
