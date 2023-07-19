const { 
    register, 
    login, 
    getUsers, 
    getUserId, 
    deleteUser, 
    getUserCount, 
    updateUser, 
    subscribeUser, 
    likeUser, 
    getSearchUsers,
    addSearchWord,
    getSearchWords,
    deleteAllSearchWords,
    bookmarkProduct,
    getBookmarkedProducts,
    resetPassword
} = require('../controllers/user');
const express = require('express');
const router = express.Router();
const { validateRegisterRequest, validateLoginRequest, isRequestValidated } = require('../validators/auth');
const { requireSignin } = require('../common-middleware/');

const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');


const nodemailer = require('nodemailer');
const MailGen = require('mailgen');


const { User } = require('../models/user');
const { uploadProfileToS3, getFile, deleteProfileUrl } = require('../s3')

require('dotenv/config');

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

router.get('/', getUsers);
router.get('/:id', getUserId);
router.get(`/get/count`, getUserCount);
router.get(`/search/users`, getSearchUsers);
router.post('/login', validateLoginRequest, isRequestValidated, login);
router.post('/register', validateRegisterRequest, isRequestValidated, register);
router.put('/:id', updateUser); 
router.delete(`/:id`, deleteUser);
router.post(`/:userId/searchwords`, addSearchWord);
router.get(`/:userId/searchwords`, getSearchWords);
router.delete(`/:userId/searchwords`, deleteAllSearchWords);
router.patch('/:userId/bookmarks/:productId', bookmarkProduct);
router.get('/:userId/bookmarks', getBookmarkedProducts);

router.post('/profile', requireSignin, (req, res)=>{
    res.status(200).json({user: 'profile'})
});
router.patch('/subscribeUser', subscribeUser, requireSignin);
router.patch('/:id/like', likeUser, requireSignin);

router.post("/:id/profile-image", upload.single('image'), async (req, res) => {
    const file = req.file;
    const userId = req.params.id;

    if (!file || !userId) return res.status(400).json({ message: "File or user id is not available"});

    try {
        const key = await uploadProfileToS3({file, userId});
        if (key) {
            const updateUser = await User.findByIdAndUpdate(
                userId,
                { image: key.key },
                { new: true}
            );   
        
            return res.status(201).json({key});
        }
        
    } catch (error) {
        return res.status(500).json({message: error.message});
    }
});

router.get("/images/:key", async (req, res) => {
    const key = req.params.key;
    const imageUrl = getFile(key);
    res.send(imageUrl)
});

router.delete("/imagedelete/profiles/:key", async(req, res) => {
    const key = req.params.key;
    deleteProfileUrl(key)
    res.send()
})


router.post('/resetPassword', async(req, res) => {
    const { userEmail } = req.body;
    console.log('email', userEmail);

    let config = {
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        }
    }

    let transporter = nodemailer.createTransport(config);

    // let message = await transporter.sendMail({
    //         from: '"Fred Foo 👻" <foo@example.com>', // sender address
    //         to: "bar@example.com, baz@example.com", // list of receivers
    //         subject: "Hello ✔", // Subject line
    //         text: "Hello world?", // plain text body
    //         html: "<b>Hello world?</b>", // html body
    //     });

    let MailGenerator = MailGen({
        theme: "default",
        product: {
            name: "MailGen",
            link: 'https://mailgen.js'
        }
    })

    let response = {
        body: {
            name: "",
            intro: "Test email",
            outro: "Bye bye"
        }
    }

    let mail = MailGenerator.generate(response)

    let message = {
        from: process.env.EMAIL,
        to: userEmail,
        subject: "Testing 123",
        html: mail
    }

    transporter.sendMail(message).then((info) => {
        return res.status(201).json({
            message: "You've got mail",
            info: info.messageId,
            preview: nodemailer.getTestMessageUrl(info)
        })
    }).catch(error => {
        return res.status(500).json({ error })
    })
    
});

module.exports = router;