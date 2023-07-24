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
    resetPassword,
    verifyEmail,
    checkEmail,
    resendEmailVerification
} = require('../controllers/user');
const express = require('express');
const router = express.Router();
const { validateRegisterRequest, validateLoginRequest, isRequestValidated } = require('../validators/auth');
const { requireSignin } = require('../common-middleware/');

const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

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
router.post('/:userId/verifyemail', verifyEmail);
router.post(`/checkEmail`, checkEmail);
router.post(`/resendCheckEmail`, resendEmailVerification);

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


router.post('/resetPassword', resetPassword);

module.exports = router;