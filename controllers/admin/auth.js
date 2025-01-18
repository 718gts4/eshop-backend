const { User } = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAdminOrSuperAdmin } = require("../../utils/validation");

async function createAdminUser({ name, email, phone, password }) {
    const isExistingUser = await User.findOne({ email });
    if (isExistingUser) {
        const error = new Error('이미 등록된 이메일 주소입니다.');
        error.statusCode = 400;
        throw error;
    }

    const user = new User({
        checkForAdminRegistration: true,
        email,
        isAdmin: false,
        name,
        passwordHash: bcrypt.hashSync(password, 10),
        phone,
        role: "admin"
    });

    const savedUser = await user.save();
    if (!savedUser) {
        const error = new Error('사용자를 생성할 수 없습니다!');
        error.statusCode = 400;
        throw error;
    }

    return {
        email: savedUser.email,
        id: savedUser.id,
        name: savedUser.name,
        phone: savedUser.phone,
        role: savedUser.role
    };
}

// Service function to handle user login logic
async function authenticateAdminUser({ email, password }) {
    const user = await User.findOne({ email });
    
    if (!user) {
        const error = new Error('이메일이나 비밀번호가 잘못되었습니다.');
        error.statusCode = 400;
        throw error;
    }

    const isPasswordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordMatch) {
        const error = new Error('이메일이나 비밀번호가 잘못되었습니다.');
        error.statusCode = 400;
        throw error;
    }

    if (!isAdminOrSuperAdmin(user.role)) {
        const error = new Error('관리자 권한이 없습니다.');
        error.statusCode = 403;
        throw error;
    }

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.secret,
        { expiresIn: '1d' }
    );

    return {
        email: user.email,
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token
    };
}

// Controller functions
exports.register = async (req, res) => {
    try {
        const user = await createAdminUser(req.body);
        res.status(201).json({
            message: "관리자 등록이 완료되었습니다.",
            user
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(error.statusCode || 500).json({ 
            message: error.message || "서버 오류가 발생했습니다." 
        });
    }
};

exports.login = async (req, res) => {
    console.log('[DEBUG] Login attempt:', { email: req.body.email });
    try {
        const user = await authenticateAdminUser(req.body);
        res.status(200).json({ message: '로그인이 완료되었습니다.', user });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(error.statusCode || 500).json({ 
            message: error.message || "서버 오류가 발생했습니다." 
        });
    }
};

exports.requestProfile = async (req, res) => {
    res.json({ user: req.user });
};
