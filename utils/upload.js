const fs = require("fs");
const multer = require("multer");
const path = require("path");
const shortid = require("shortid");

const validFileTypes = {
  image: {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
  },
  video: {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "video/mp4": "mp4",
    "video/mpeg": "mpeg",
    "video/quicktime": "mov",
    "video/x-msvideo": "avi",
  },
};

const MEGABYTE = 1024 * 1024;

function createUploadFolderIfNotExists() {
  const uploadsFolder = path.join(path.dirname(__dirname), "uploads");
  if (!fs.existsSync(uploadsFolder)) {
    fs.mkdirSync(uploadsFolder);
  }
  return uploadsFolder
}

const checkForValidFileType = (validFileTypes, file, errorMessage) => {
    const isValid = validFileTypes[file.mimetype];
    const uploadError = isValid ? null : new Error(errorMessage);
    return uploadError;
}

const createFileName = (file) => {
    const fileName = file.originalname.split(" ").join("-");
    return shortid.generate() + "-" + fileName;
}

function createMulterStorage(validFileTypes, errorMessage) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadError = checkForValidFileType(validFileTypes, file, errorMessage) 
      const uploadsFolder = createUploadFolderIfNotExists();
      cb(uploadError, uploadsFolder);
    },
    filename: function (req, file, cb) {
      cb(null, createFileName(file));
    },
  });
}

const errorMsg = {
  IMAGE: "이미지 파일은 .png, .jpeg, .jpg만 가능합니다.",
  VIDEO: ".mp4, .mpeg, .mov and .avi 파일만 가능합니다!",
};

const imageStorage = createMulterStorage(validFileTypes.image, errorMsg.IMAGE);
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * MEGABYTE },
});

const videoStorage = createMulterStorage(validFileTypes.video, errorMsg.VIDEO);
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * MEGABYTE },
});

module.exports = { uploadImage, uploadVideo, MEGABYTE };
