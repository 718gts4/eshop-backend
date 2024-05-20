const express = require("express");
const router = express.Router();
const { uploadProfileToS3, deleteFileFromS3, deleteFile } = require("../s3");
const { Vendor } = require("../models/vendor");
const { User } = require("../models/user");
require("dotenv/config");
const fs = require("fs");
const { uploadImage } = require("../utils/upload");

router.post(`/create`, uploadImage.array("image", 2), async (req, res) => {
    const {
        brandName,
        email,
        phone,
        bankName,
        bankAccount,
        bankOwner,
        submitted,
        userId,
    } = req.body;

    try {
        const userId = req.user.userId; 
        const [profileImage, documentImage]  = req.files.map((file) => ({
            file: fs.readFileSync(file.path),
        }));
        const imageUploadPromises = [ 
            uploadProfileToS3(profileImage,`${userId}-image`), 
            uploadProfileToS3(documentImage,`${userId}-document`) 
        ];
        const uploadedImages = await Promise.all(imageUploadPromises);
        const [ imageKey, documentKey] = uploadedImages.map(({key}) => key);

        let vendor = new Vendor({
            document: documentKey,
            brandName,
            email,
            phone,
            bankName,
            bankAccount,
            bankOwner,
            userId,
            submitted: submitted || true,
        });

        vendor = await vendor.save();

        if (!vendor) {
            return res.status(500).send("사업자를 생성할 수 없습니다");
        }

        const user = await User.findById(userId);
        user.$ignore = ["passwordHash", "email"];
        if (user) {
            user.image = imageKey;
            user.brand = brandName;
            user.phone = phone;
            user.submitted = true;
            user.followers = {};
            user.following = {};
            user.likes = {};
            user.role = "admin";
            await user.save({ validateBeforeSave: false });
        }

        res.status(201).json({ vendor });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error adding product" });
    }
});


// multipart/form-data

// Page 1: General Information
router.patch('/general', uploadImage.single("image"), async (req, res ) => {
    if (!req?.file) {
      console.log("profile image upload: no file");
      return null;
    }
    let filePath = req.file.path;
    try {
        let imageUrl = null;
        const userId = req.user.userId; 
        const imageS3Key = `${userId}-image`
        const currentUser = await User.findById(userId);
        if (currentUser.image) {
            await deleteFileFromS3(currentUser.image);
        }
        const { brand, link, name, brandDescription, username } = req.body;
        const image = req?.file ? { file: fs.readFileSync(req.file.path) } : null;
        if (image) {
          const { key } = await uploadProfileToS3(image, imageS3Key);
          imageUrl = key;
        } else {
          console.log("no image to upload");
        }

        let updateFields = {
            brand,
            brandDescription,
            link,
            name,
            username,
        };
        
        if (imageUrl) {
            updateFields.image = imageUrl;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true }
        );
        console.log('updated user',{userId})
        res.status(200).json({ user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating vendor' });
    } finally {
        console.log({fPath:filePath});
        if (req?.file?.path) {
            // deletes the file in e.g. filePath: `/uploads/_rRqy8LA2-blob`
            deleteFile(  filePath  );
        }
    }
});

// Page 2: Managers

// Page 3: Delivery Address


module.exports = router;
