const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const multer = require("multer");
const path = require("path");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// Create an instance of multer-s3 storage engine
const storage = multerS3({
  s3: s3,
  bucket: bucketName,
  acl: "public-read",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, `images/${Date.now().toString()}-${file.originalname}`);
  },
});

// Create an instance of multer middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB
  },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg" && ext !== ".gif") {
      return cb(new Error("Only images are allowed"));
    }
    cb(null, true);
  },
});

// Function to upload file buffer to S3
async function uploadFileToS3(fileBuffer) {
  const params = {
    Bucket: bucketName,
    Key: `images/${Date.now().toString()}-${Math.round(
      Math.random() * 1e9
    )}.jpeg`,
    Body: fileBuffer,
    ContentType: "image/jpeg",
    ACL: "public-read",
  };

  try {
    const command = new PutObjectCommand(params);
    const data = await s3.send(command);
    console.log(`File uploaded successfully. ${data.Location}`);
    return data.Location;
  } catch (err) {
    console.log(`Error uploading file. ${err.message}`);
    throw err;
  }
}

module.exports = { s3, uploadFileToS3, upload };
