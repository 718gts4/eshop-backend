const multer = require("multer");
const multerS3 = require("multer-s3");

const {
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuid } = require("uuid");
const sharp = require("sharp");
const fs = require("fs");

const BUCKET = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const image_url = process.env.AWS_CDN_URL;
const video_url = process.env.AWS_CDN_URL;
const profile_url = process.env.AWS_CDN_PROFILE_URL;
const product_url = process.env.AWS_CDN_PRODUCT_URL;

const s3 = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
    signatureVersion: "v2", // set version to v2
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
    const imageUrl = `${profile_url}${key}`;
    return imageUrl;
};

exports.getVideoImageFile = (key) => {
    const imageUrl = `${image_url}${key}`;
    return imageUrl;
};

exports.getVideoFile = (key) => {
    const videoUrl = `${video_url}${key}`;
    return videoUrl;
};

exports.getProductImageFile = (key) => {
    const productUrl = `${product_url}${key}`;
    return productUrl;
};

exports.deleteProductUrl = async (key) => {
    const productKey = "products/" + key;
    const params = {
        Bucket: BUCKET,
        Key: productKey,
    };
    const s3Command = new DeleteObjectCommand(params);
    try {
        await s3.send(s3Command);
        console.log(`Deleted object with key ${key} from bucket`);
    } catch (error) {
        console.log("error", error);
    }
};

exports.deleteProfileUrl = async (key) => {
    const profileKey = "profiles/" + key;
    const params = {
        Bucket: BUCKET,
        Key: profileKey,
    };
    const s3Command = new DeleteObjectCommand(params);
    try {
        await s3.send(s3Command);
        console.log(`Deleted object with key ${key} from bucket`);
    } catch (error) {
        console.log("error", error);
    }
};

exports.deleteUrl = async (key) => {
    const params = {
        Bucket: BUCKET,
        Key: key,
    };
    const s3Command = new DeleteObjectCommand(params);
    try {
        await s3.send(s3Command);
        console.log(`Deleted object with key ${key} from bucket`);
    } catch (error) {
        console.log("error", error);
    }
};

exports.uploadProductImageToS3 = async (image) => {
    const { file } = image;

    const buffer = await sharp(file.buffer).rotate().resize(300).toBuffer();

    const key = `products/${uuid()}`;
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

exports.uploadProfileToS3 = async (image) => {
    const { file } = image;

    const buffer = await sharp(file.buffer).rotate().resize(600).toBuffer();

    const key = `profiles/${uuid()}`;
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
    upload.single("thumbnail")(req, res, async (error) => {
        if (error) {
            console.log("Error uploading video image:", error);
            return res
                .status(500)
                .json({ error: "Failed to upload video image" });
        }
        // Access the uploaded file's key
        const key = req.file.key;

        const streamToBuffer = (stream) => {
            return new Promise((resolve, reject) => {
                const chunks = [];
                stream.on("data", (chunk) => chunks.push(chunk));
                stream.on("error", reject);
                stream.on("end", () => resolve(Buffer.concat(chunks)));
            });
        };

        try {
            const getObjectParams = {
                Bucket: BUCKET,
                Key: key,
            };
            const data = await s3.send(new GetObjectCommand(getObjectParams));
            const buffer = await streamToBuffer(data.Body);
            // Resize the image
            const resizedImage = await sharp(buffer)
                .resize(700) // Specify the desired width (e.g., 300 pixels)
                .toBuffer();

            // Generate a unique key for the resized image
            const resizedKey = `${uuid()}-resized-${req.file.originalname}`;

            // Upload the resized image to S3
            const uploadParams = {
                Bucket: BUCKET,
                Key: resizedKey,
                Body: resizedImage,
                ContentType: req.file.mimetype,
            };

            await s3.send(new PutObjectCommand(uploadParams));

            // Update req.file with the resized image's key
            req.file.key = resizedKey;

            // Delete the original file key
            const s3Command = new DeleteObjectCommand(getObjectParams);
            try {
                await s3.send(s3Command);
                console.log(`Deleted object with key ${key} from bucket`);
            } catch (error) {
                console.log("error", error);
            }
            // Return the key in the response
            return res.status(200).json({ resizedKey });
        } catch (error) {
            console.log("Error resizing and uploading video image:", error);
            return res
                .status(500)
                .json({ error: "Failed to resize and upload video image" });
        }
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

    return Contents.sort(
        (a, b) => new Date(b.LastModified) - new Date(a.LastModified)
    ).map((image) => image.Key);
};

exports.getUserPresignedUrls = async (userId) => {
    try {
        const imageKeys = await getImageKeysByUser(userId);

        const presignedUrls = await Promise.all(
            imageKeys.map((key) => {
                const command = new GetObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                });
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

    return Contents.sort(
        (a, b) => new Date(b.LastModified) - new Date(a.LastModified)
    ).map((video) => video.Key);
};

exports.getVideoPresignedUrls = async (userId) => {
    try {
        const videoKeys = await getVideoKeysByUser(userId);

        const presignedVideoUrls = await Promise.all(
            videoKeys.map((key) => {
                const command = new GetObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                });
                return getSignedUrl(s3, command, { expiresIn: 600 }); // default
            })
        );

        return { presignedVideoUrls };
    } catch (error) {
        console.log(error);
        return { error };
    }
};

exports.uploadBase64ImageToS3 = async (base64Image) => {
    try {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

        const buffer = Buffer.from(base64Data, "base64");

        const resizedImageBuffer = await sharp(buffer).resize(700).toBuffer();

        const key = `${uuid()}-resized-image.jpg`;

        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                Body: resizedImageBuffer,
                ContentType: "image/jpeg",
            })
        );
        const resizedKey = `${uuid()}-resized-${key}`;
        return resizedKey;
    } catch (error) {
        console.error("Error uploading base64 image to S3:", error);
        throw new Error("Failed to upload base64 image to S3");
    }
};
