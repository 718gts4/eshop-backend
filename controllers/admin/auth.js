const { User } = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// const { validationResult} = require('express-validator');

exports.register = async (req, res) => {
    const registerUser = await User.findOne({ email: req.body.email });
    if (registerUser)
        return res.status(400).json({
            message: "이미 등록된 이메일 주소입니다.",
        });

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: false,
        checkForAdminRegistration: true,
        role: "admin",
    });
    user = await user.save();

    if (!user) return res.status(400).send("사용자를 생성할 수 없습니다!");

    res.status(201).json({
        message: "사용자가 성공적으로 등록되었습니다. 관리자의 승인을 기다려주세요.",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isAdmin: user.isAdmin
        }
    });
};

exports.login = async (req, res) => {
    console.log('[DEBUG] Login attempt:', { email: req.body.email });
    try {
        console.log('[DEBUG] Searching for user in database...');
        const user = await User.findOne({ email: req.body.email });
        const secret = process.env.secret;
        
        if (!user) {
            console.log('[DEBUG] User not found in database');
            return res.status(400).json({ message: "The user not found" });
        }
        
        console.log('[DEBUG] User found:', { 
            id: user._id, 
            email: user.email, 
            role: user.role, 
            isAdmin: user.isAdmin 
        });
    } catch (error) {
        console.error('[ERROR] Error during login:', error);
        return res.status(500).json({ message: "An error occurred during login" });
    }

    const isPasswordValid = bcrypt.compareSync(req.body.password, user.passwordHash);
    console.log('[DEBUG] Password validation:', isPasswordValid);

    const oneDayInSeconds = 60 * 60 * 24;
    if (isPasswordValid) {
        if (user.role === "admin" || user.role === "superAdmin") {
            const token = jwt.sign(
                {
                    userId: user.id,
                    id: user.id,
                    isAdmin: user.isAdmin,
                    isSuperAdmin: user.role === 'superAdmin',
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
            
            console.log('[DEBUG] Login successful');
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
            console.log('[DEBUG] Login failed: Not an admin or superAdmin');
            res.status(403).json({ message: "Access denied. User is not an admin or superAdmin." });
        }
    } else {
        console.log('[DEBUG] Login failed: Invalid password');
        res.status(400).json({ message: "Invalid email or password" });
    }
};

exports.requestProfile = (req, res) => {
    res.status(200).json({ user: req.user });
};
