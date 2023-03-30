const { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuid } = require("uuid");
const sharp = require('sharp');

const BUCKET = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  signatureVersion: 'v2', // set version to v2
});

exports.getFile = async (key) => {
    const getObjectParams = {
        Bucket: BUCKET,
        Key: key
    }
    const command = new GetObjectCommand(getObjectParams);
    const { Body } = await s3.send(command);
    return Body;
}

exports.uploadProfileToS3 = async (image) => {
    const { file } = image;
    // resize image
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
