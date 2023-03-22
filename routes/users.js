const { register, login, getUsers, getUserId, postNewUser, deleteUser, getUserCount, updateUser, subscribeUser, likeUser } = require('../controllers/user');
const express = require('express');
const router = express.Router();
const { validateRegisterRequest, validateLoginRequest, isRequestValidated } = require('../validators/auth');
const { requireSignin } = require('../common-middleware/');

const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const { User } = require('../models/user');

const { upload, uploadFileToS3 } = require('../utilities/s3')

router.get('/', getUsers);
router.get('/:id', getUserId);
router.post(`/`, postNewUser);
router.post('/login', validateLoginRequest, isRequestValidated, login);
router.post('/register', validateRegisterRequest, isRequestValidated, register);
router.put('/:id', updateUser); 
router.delete(`/:id`, deleteUser);
router.get(`/get/count`, getUserCount);

router.post('/profile', requireSignin, (req, res)=>{
    res.status(200).json({user: 'profile'})
});
router.patch('/subscribeUser', subscribeUser, requireSignin);
router.patch('/:id/like', likeUser, requireSignin);

router.post("/:id/profile-image", upload.single("image"), async (req, res) => {
    try {
        const imageUrl = req.file.location;
        // Update the user's profile image in the database
        // ...
        res.json({ imageUrl });
    } catch (err) {
        console.log(err);
        res.status(500).json({message:'Server Error'});
    }
});

module.exports = router;