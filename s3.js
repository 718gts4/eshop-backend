const multer = require('multer');
const multerS3 = require('multer-s3');

const { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuid } = require("uuid");
const sharp = require('sharp');
const fs = require('fs');

const BUCKET = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const image_url = process.env.AWS_CDN_URL;
const video_url = process.env.AWS_CDN_URL;

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  signatureVersion: 'v2', // set version to v2
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: BUCKET,
    key: (req, file, cb) => {
      const key = `${uuid()}-${file.originalname}`;
      cb(null, key);
    },
  }),
});

exports.getFile = (key) => {
    const imageUrl = `${image_url}${key}`;
    return imageUrl;
}

exports.getVideoFile = (key) => {
    const videoUrl = `${video_url}${key}`;
    return videoUrl;
}

exports.uploadProfileToS3 = async (image) => {
    console.log('profile img s3 check', image)
    const { file } = image;

    const buffer = await sharp(file.buffer).rotate().resize(300).toBuffer()

    const key = `${uuid()}`;
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype,
    });

    try {
        await s3.send(command);
        return { key };
    } catch (error) {
        return { error };
    }
};

exports.uploadVideoImageToS3 = (req, res) => {
    upload.single('thumbnail')(req, res, (error) => {
        if (error) {
          console.log('Error uploading video image:', error);
          return res.status(500).json({ error: 'Failed to upload video image' });
        }
        
        // Access the uploaded file's key
        const key = req.file.key;

        // Return the key in the response
        return res.status(200).json({ key });
    });
};

exports.uploadVideoToS3 = async (video) => {
    const { file } = video;
    const key = `${uuid()}`;
    const stream = fs.createReadStream(file.path);

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: stream,
        ContentType: file.mimetype,
    });

    try {
        await s3.send(command);
        return { key };
    } catch (error) {
        return { error };
    }
};

const getImageKeysByUser = async (userId) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: userId,
  });

  const { Contents = [] } = await s3.send(command);

  return Contents
    .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
    .map((image) => image.Key);
};

exports.getUserPresignedUrls = async (userId) => {
  try {
    const imageKeys = await getImageKeysByUser(userId);

    const presignedUrls = await Promise.all(
      imageKeys.map((key) => {
        const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
        return getSignedUrl(s3, command, { expiresIn: 600 }); // default
      })
    );

    return { presignedUrls };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const getVideoKeysByUser = async (userId) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: userId,
  });

  const { Contents = [] } = await s3.send(command);

  return Contents
    .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
    .map((video) => video.Key);
};

exports.getVideoPresignedUrls = async (userId) => {
  try {
    const videoKeys = await getVideoKeysByUser(userId);

    const presignedVideoUrls = await Promise.all(
      videoKeys.map((key) => {
        const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
        return getSignedUrl(s3, command, { expiresIn: 600 }); // default
      })
    );

    return { presignedVideoUrls };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

exports.deleteUrl = async (key) => {
    console.log('KEY URL', key)
    const params = {
        Bucket: BUCKET,
        Key: key
    }
    const s3Command = new DeleteObjectCommand(params)
    try {
        await s3.send(s3Command)
        console.log(`Deleted object with key ${key} from bucket`)
    } catch (error) {
        console.log('error', error)
    }
};