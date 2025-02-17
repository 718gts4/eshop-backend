const { User } = require("../../models/user");
const VerificationToken = require("../../models/verificationToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { isValidObjectId } = require("mongoose");
const { AUTH_MESSAGES, ERROR_MESSAGES } = require("./messages");

const {
    generateOTP,
    mailTransport,
    generateEmailTemplate,
    generatePasswordResetEmailTemplate,
    generateResetCode,
} = require("../../utils/mail");

exports.getUsers = async (req, res) => {
    const userList = await User.find().select("-passwordHash");

    if (!userList) {
        res.status(500).json({ success: false });
    }
    res.status(200).send(userList);
};

exports.getUserId = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-passwordHash");

        if (!user) {
            return res.status(404).json({
                message: AUTH_MESSAGES.USER_NOT_FOUND
            });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error finding user:", error);
        return res.status(500).json({
            message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
};

exports.updateUser = async (req, res) => {
    const userExist = await User.findById(req.params.id);

    const usernameExist = await User.findOne({ username: req.body.username });
    if (usernameExist)
        return res.status(400).json({
            message: AUTH_MESSAGES.USERNAME_EXISTS
        });

    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist)
        return res.status(400).json({
            message: AUTH_MESSAGES.EMAIL_EXISTS
        });

    let newPassword;
    if (req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10);
    } else {
        newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            passwordHash: newPassword,
            phone: req.body.phone,
            gender: req.body.gender,
            birthday: req.body.birthday,
            isAdmin: req.body.isAdmin,
            role: req.body.role,
            brand: req.body.brand,
            brandDescription: req.body.brandDescription,
            followers: req.body.followers,
            following: req.body.following,
            likes: req.body.likes,
            savedVideos: req.body.savedVideos,
            bookmarkProducts: req.body.bookmarkProducts,
            savedProducts: req.body.savedProducts,
            videos: req.body.videos,
            link: req.body.link,
        },
        { new: true }
    );

    if (!user)
        return res.status(400).json({ message: AUTH_MESSAGES.UPDATE_FAILED });

    res.send(user);
};

exports.deleteUser = (req, res) => {
    User.findByIdAndRemove(req.params.id)
        .then((user) => {
            if (user) {
                return res
                    .status(200)
                    .json({ success: true, message: "the user is deleted" });
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: AUTH_MESSAGES.USER_NOT_FOUND });
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, error: err });
        });
};

exports.register = async (req, res) => {
    const registerUser = await User.findOne({ email: req.body.email });

    if (registerUser)
        return res.status(400).json({
            message: AUTH_MESSAGES.EMAIL_EXISTS
        });

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        role: req.body.role || 'user',
        brand: req.body.brand,
        brandDescription: req.body.brandDescription,
        bookmarkProducts: req.body.bookmarkProducts,
        followers: {},
        following: {},
        likes: {},
        vendor: req.body.role === 'admin' ? {} : undefined,
    });

    const OTP = generateOTP();

    const verificationToken = new VerificationToken({
        owner: user._id,
        token: OTP,
    });

    await verificationToken.save();
    user = await user.save();

    if (!user)
        return res.status(400).json({ message: AUTH_MESSAGES.REGISTRATION_FAILED });

    mailTransport().sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: "VOUTIQ 가입 PIN 번호입니다",
        html: generateEmailTemplate(OTP),
    }, (error, info) => {
        if(error){
            console.log('Error sending email', error.message);
            return res.status(500).json({ message: AUTH_MESSAGES.EMAIL_SEND_FAILED });
        } else {
            console.log('Email sent', info.response);
        }
    });

    res.send(user);
};

exports.login = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.secret;
    const twentyYearsInSeconds = 60 * 60 * 24 * 365 * 20;
    if (!user) {
        return res.status(400).json({
            message: AUTH_MESSAGES.INVALID_CREDENTIALS
        });
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                id: user.id,
                role: user.role,
                isAdmin: user.isAdmin,
            },
            secret,
            { expiresIn: twentyYearsInSeconds }
        );
        res.status(200).json({
            token,
            user
        });
    } else {
        res.status(400).json({
            message: AUTH_MESSAGES.INVALID_CREDENTIALS
        });
    }
};

exports.getUserCount = async (req, res) => {
    const userCount = await User.countDocuments();

    if (!userCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        userCount: userCount,
    });
};

exports.subscribeUser = async (req, res) => {
    try {
        const vendorId = req.body.vendorId;
        const userId = req.body.userId;
        const vendor = await User.findById(vendorId);
        const user = await User.findById(userId);
        const isFollowing = vendor.followers.get(userId);

        if (isFollowing) {
            vendor.followers.delete(userId);
            user.following.delete(vendorId);
        } else {
            vendor.followers.set(userId, true);
            user.following.set(vendorId, true);
        }

        const updatedVendor = await User.findByIdAndUpdate(
            vendorId,
            { followers: vendor.followers },
            { new: true }
        );

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { following: user.following },
            { new: true }
        );

        res.status(200).json([updatedVendor, updatedUser]);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

exports.likeUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: ERROR_MESSAGES.INVALID_USER_ID_PARAMS });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: ERROR_MESSAGES.INVALID_USER_ID_BODY });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: AUTH_MESSAGES.USER_NOT_FOUND });
        }

        const isLiked = user.likes?.get(userId);

        if (isLiked) {
            user.likes.delete(userId);
        } else {
            user.likes.set(userId, true);
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { likes: user.likes },
            { new: true }
        );

        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

exports.getSearchUsers = async (req, res) => {
    try {
        const { search } = req.query;
        const users = await User.find({
            $or: [
                { username: { $regex: search, $options: "i" } },
                { brand: { $regex: search, $options: "i" } },
            ],
            isAdmin: true,
        }).select([
            "_id",
            "name",
            "brand",
            "image",
            "phone",
            "username",
            "email",
            "brandDescription",
            "videos",
            "following",
            "followers",
            "likes",
            "link",
            "addresses",
        ]);

        res.json(users);
    } catch (error) {
        console.error("Error", error);
        res.status(500).json({ message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

exports.addSearchWord = async (req, res) => {
    try {
        const { searchWord } = req.body;
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: AUTH_MESSAGES.USER_NOT_FOUND });
        }
        user.searchWords.unshift(searchWord);
        await user.save();

        res.status(200).json({ message: "Search word added successfully" });
    } catch (error) {
        res.status(500).json({ message: AUTH_MESSAGES.GENERIC_ERROR });
    }
};

exports.getSearchWords = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: AUTH_MESSAGES.USER_NOT_FOUND });
        }

        const searchWords = user.searchWords;

        res.status(200).json({ searchWords });
    } catch (error) {
        console.error("Error", error);
        res.status(500).json({ message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

exports.deleteAllSearchWords = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: AUTH_MESSAGES.USER_NOT_FOUND });
        }

        user.searchWords = [];
        await user.save();

        res.json({ message: "Search words deleted successfully" });
    } catch (error) {
        console.error("Error", error);
        res.status(500).json({ message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

exports.bookmarkProduct = async (req, res) => {
    try {
        const { productId, userId } = req.params;
        const user = await User.findById(userId);

        if (!user.bookmarkProducts) {
            user.bookmarkProducts = [];
        }

        const productIdStr = productId.toString();

        let bookmarkIndex = -1;
        for (let i = 0; i < user.bookmarkProducts?.length; i++) {
            if (user.bookmarkProducts[i].toString() === productIdStr) {
                bookmarkIndex = i;
                break;
            }
        }

        if (bookmarkIndex > -1) {
            user.bookmarkProducts.splice(bookmarkIndex, 1);
        } else {
            user.bookmarkProducts.push(productId);
        }

        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

exports.getBookmarkedProducts = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate("bookmarkProducts");

        if (!user) {
            return res.status(404).json({ message: AUTH_MESSAGES.USER_NOT_FOUND });
        }

        const bookmarkedProducts = user.bookmarkProducts;

        res.status(200).json(bookmarkedProducts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.checkEmail = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp.trim()) {
        return res.status(400).json({ message: AUTH_MESSAGES.INVALID_PIN });
    }

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: AUTH_MESSAGES.INVALID_USER_ID });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: AUTH_MESSAGES.USER_NOT_FOUND });

    if (user.verified)
        return res.status(400).json({ message: AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED });

    const token = await VerificationToken.findOne({ owner: userId });
    if (!token) return res.status(400).json({ message: AUTH_MESSAGES.USER_NOT_FOUND });

    const isMatched = await token.compareToken(otp);
    if (!isMatched) return res.status(400).json({ message: AUTH_MESSAGES.INVALID_OTP });

    user.verified = true;

    await VerificationToken.findByIdAndRemove(token._id);
    await user.save();

    res.json({ success: true, message: "Email is verified", user: user });
};

exports.resendEmailVerification = async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.json({ error: AUTH_MESSAGES.USER_NOT_FOUND });

    if (user.verified)
        return res.json({ error: AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED });

    const alreadyHasToken = await VerificationToken.findOne({
        owner: userId,
    });
    if (alreadyHasToken)
        return res.json({ error: AUTH_MESSAGES.OTP_REQUEST_LIMIT });

    const OTP = generateOTP();
    console.log("new otp", OTP);

    const newVerificationToken = new VerificationToken({
        owner: userId,
        token: OTP,
    });

    await newVerificationToken.save();

    mailTransport().sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: "VOUTIQ 가입 PIN 번호입니다",
        html: generateEmailTemplate(OTP),
    });

    res.json({ message: AUTH_MESSAGES.NEW_OTP_SENT });
};

exports.resetPassword = async (req, res) => {
    const email = req.body.email;
    const existingUser = await User.findOne({email});

    if(!existingUser){
        console.error({success:false, message: AUTH_MESSAGES.GENERIC_ERROR});
        return res.json({success: false, message: '사용자가 존재하면 이메일이 발송되었습니다.'});
    }

    const token = generateResetCode()
    existingUser.resettoken = token;
    existingUser.resettokenExpiration = Date.now() + 360000;

    await existingUser.save();

    mailTransport().sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: "VOUTIQ 비밀번호 재설정 인증번호입니다",
        html: generatePasswordResetEmailTemplate(token),
    });

    return res.json({ success:true, message: AUTH_MESSAGES.RESET_CODE_SENT });
};

exports.resetPasswordConfirm = async (req, res) => {
    try {
        const email = req.body.email;
        const verificationCode = req.body.verificationCode;
        const password = req.body.password;
        const user = await User.findOne({ email });

        if (!user || user.resettoken !== verificationCode) {
            return res.status(400).json({success:false, message: AUTH_MESSAGES.INVALID_RESET_CODE});
        }

        if (user.resettokenExpiration < new Date()) {
            return res.status(400).json({success:false, message: AUTH_MESSAGES.RESET_CODE_EXPIRED});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.passwordHash = hashedPassword;
        user.resettoken = "";
        user.resettokenExpiration = null;
        await user.save();

        return res.status(200).json({success:true});
    } catch (error) {
        return res.status(500).json({ success: false, message: AUTH_MESSAGES.GENERIC_ERROR });
    }
};

exports.getAllAdminUsers = async (req, res) => {
    try {
        const adminUsers = await User.find({ isAdmin: true }).select([
            "_id",
            "name",
            "brand",
            "image",
            "phone",
            "username",
            "brandDescription",
            "videos",
            "following",
            "followers",
            "likes",
            "link",
            "addresses",
        ]);

        res.status(200).json(adminUsers);
    } catch (error) {
        res.status(500).json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

exports.checkUsername = async (req, res) => {
    const { username } = req.query;

    try {
        const existingUser = await User.findOne({ username: username });
        res.json({ unique: !existingUser });
    } catch (error) {
        console.log("Error checking username:", error);
        res.status(500).json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
    }
};