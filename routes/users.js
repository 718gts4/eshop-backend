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

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 2 // 2mb file size
    },
    fileFilter: (req, file, callback) => {
        const fileExts = [".png", ".jpg", ".jpeg", ".gif"];
        const isAllowedExt = fileExts.includes(
            path.extname(file.originalname.toLowerCase())
        );
        const isAllowedMimeType = file.mimetype.startsWith("image/");
        if (isAllowedExt && isAllowedMimeType) {
            return callback(null, true); // no errors
        } else {
            callback("Error: File type not allowed!");
        }
    }
});


const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
    region,
    credetials: {
        accessKeyId,
        secretAccessKey
    }
});

router.get('/', getUsers);
router.get('/:id', getUserId);
router.post(`/`, postNewUser);
router.post('/login', validateLoginRequest, isRequestValidated, login);
router.post('/register', validateRegisterRequest, isRequestValidated, register);
router.put('/:id', updateUser, upload.single("profilePicture")); 
router.delete(`/:id`, deleteUser);
router.get(`/get/count`, getUserCount);

router.post('/profile', requireSignin, (req, res)=>{
    res.status(200).json({user: 'profile'})
});
router.patch('/subscribeUser', subscribeUser, requireSignin);
router.patch('/:id/like', likeUser, requireSignin);

router.put(`/:id/profile-image`,
    upload.single("image"),
    async (req, res) => {
        const file = req.file;
        const caption = req.body.caption;

        const fileBuffer = await sharp(file.buffer)
            .resize({width:300, fit: "inside"})
            .jpeg({quality: 80})
            .toBuffer()

        const s3 = new S3Client({
            region,
            credetials: {
                accessKeyId,
                secretAccessKey
            }
        });

        const params = {
            Bucket: bucketName,
            Key: `profile-images/${req.params.id}`,
            Body: fileBuffer
        }

        const result = await s3.putObject(params).promise();

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { image: result.Location },
            { new: true }
        );
        res.status(200).json(user);
    }
)

module.exports = router;