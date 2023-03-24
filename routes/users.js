const { register, login, getUsers, getUserId, postNewUser, deleteUser, getUserCount, updateUser, subscribeUser, likeUser } = require('../controllers/user');
const express = require('express');
const router = express.Router();
const { validateRegisterRequest, validateLoginRequest, isRequestValidated } = require('../validators/auth');
const { requireSignin } = require('../common-middleware/');


const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const shortid = require('shortid');
const sharp = require('sharp');
const { User } = require('../models/user');
const { getUserPresignedUrls, uploadToS3 } = require('../s3')

require('dotenv/config');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
  }
  
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//     const isValid = FILE_TYPE_MAP[file.mimetype];
//     let uploadError = new Error('이미지 파일은 .png, .jpeg, .jpg만 가능합니다.');
//     if(isValid){
//         uploadError = null
//     }
//     cb(uploadError, path.join(path.dirname(__dirname), 'uploads'))
//     },
//     filename: function (req, file, cb) {
//     const fileName = file.originalname.split(' ').join('-');
//     cb(null, shortid.generate() + '-' + fileName)
//     }
// })

// const upload = multer({ storage })
const bucketV = process.env.AWS_BUCKET_NAME;

const s3 = new S3Client()

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'bucketV',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})


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

router.post("/:id/profile-image", upload.single('image'), async (req, res) => {
    const file = req.body.uri;
    const userId = req.params.id;

    if (!file || !userId) return res.status(400).json({ message: "Bad request"});

    try {
        const key = await uploadToS3({file, userId});
        console.log('key',key)
        return res.status(201).json({key});
    } catch (error) {
        return res.status(500).json({message: error.message});
    }
});

module.exports = router;