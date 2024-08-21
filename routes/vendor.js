const express = require("express");
const router = express.Router();
const {
    uploadProfileToS3,
    deleteFileFromS3,
    deleteFile,
    deleteUrl,
} = require("../s3");
const { Vendor } = require("../models/vendor");
const { User } = require("../models/user");
require("dotenv/config");
const fs = require("fs");
const { uploadImage } = require("../utils/upload");
const bcrypt = require("bcryptjs");

router.post(`/create`, uploadImage.array("image", 2), async (req, res) => {
    console.log("routes/vendor::: CREATE", `router.post('/create'`);
    const {
        brandName,
        // email, // remove email from onboarding. As we keep the existing user email
        phone,
        bankName,
        bankAccount,
        bankOwner,
        submitted,
        userId,
    } = req.body;

    try {
        if (!userId) {
            return res.status(401).json({ error: "No userId!" });
        }
        // Check if req.files is defined and has at least one file
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files were uploaded." });
        }

        const [profileImage, documentImage] = req.files.map((file) => ({
            file: fs.readFileSync(file.path),
        }));
        const imageUploadPromises = [
            uploadProfileToS3(profileImage, `${userId}-image`),
            uploadProfileToS3(documentImage, `${userId}-document`),
        ];
        const uploadedImages = await Promise.all(imageUploadPromises);
        const [imageKey, documentKey] = uploadedImages.map(({ key }) => key);

        let vendor = new Vendor({
            bank: {
                accountName: bankOwner,
                accountNumber: bankAccount,
                bankName,
            },
            bankHistory: [
                {
                    accountName: bankOwner,
                    accountNumber: bankAccount,
                    bankName,
                },
            ],
            document: { s3Key: documentKey },
            submitted: submitted || true,
            userId,
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

router.post("/validate-username/:username", async (req, res) => {
    console.log("routes/vendor::: POST /validate-username/:username");
    const { username } = req.params;
    const { userId } = req.body;
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            return res
                .status(200)
                .json({ valid: true, message: "Username is available." });
        }
        if (user._id.toString() === userId) {
            // If the username belongs to the current user, it's valid
            return res
                .status(200)
                .json({ valid: true, message: "Username is valid." });
        } else {
            // If the username belongs to a different user, it's not valid
            return res
                .status(200)
                .json({ valid: false, message: "Username is already taken." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error validating username." });
    }
});

// multipart/form-data

// Page 1: General Information
router.patch(
    "/profile-form/general",
    uploadImage.single("image"),
    async (req, res) => {
        console.log("routes/vendor::: PATCH", `patch /profile-form/general`);

        let ImageFilePath = req?.file?.path;
        let imageUrl = null;
        try {
            const userId = req.user.userId;
            const imageS3Key = `${userId}-image`;
            const { image: oldImage } = await User.findById(userId);
            if (ImageFilePath) {
                if (oldImage) {
                    await deleteFileFromS3(oldImage);
                }
                const newImage = { file: fs.readFileSync(ImageFilePath) };
                const { key } = await uploadProfileToS3(newImage, imageS3Key);
                imageUrl = key;
            }
            const {
                brand,
                brandDescription,
                email,
                link,
                name,
                password,
                username,
            } = req.body;

            let updateFields = {
                brand,
                brandDescription,
                email,
                link,
                name,
                username,
            };

            if (password) {
                const passwordHash = bcrypt.hashSync(password, 10);
                updateFields.passwordHash = passwordHash;
            }

            // Check if email already exists (unless it is current user)
            const userWithSameEmail = await User.findOne({ email });
            if (
                userWithSameEmail &&
                String(userWithSameEmail._id) !== String(userId)
            ) {
                return res.status(400).json({
                    message: "이미 등록된 이메일 주소입니다.",
                });
            }

            if (imageUrl) {
                updateFields.image = imageUrl;
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                updateFields,
                {
                    new: true,
                }
            );
            console.log("updated user", { userId });
            res.status(200).json({ user: updatedUser });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server error updating vendor" });
        } finally {
            if (ImageFilePath) {
                // After uploading to S3, deletes the temp file. e.g. filePath: `/uploads/_rRqy8LA2-blob`
                deleteFile(ImageFilePath);
            }
        }
    }
);

// Page 2: Managers
router.patch("/profile-form/managers", async (req, res) => {
    console.log("routes/vendor::: PATCH /profile-form/managers");
    try {
        const userId = req.user.userId;
        const { contacts } = req.body;

        let updateFields = {
            "contacts.store": contacts.store,
            "contacts.customerService": contacts.customerService,
            "contacts.finance": contacts.finance,
        };

        const vendor = await Vendor.findOne({ userId });
        if (!vendor) {
            return res
                .status(404)
                .json({ error: `Vendor not found for userId ${userId}` });
        }

        const updatedVendor = await Vendor.findOneAndUpdate(
            { userId },
            updateFields,
            { new: true }
        );

        if (!updatedVendor) {
            return res.status(404).json({ error: "Vendor not found" });
        }

        res.status(200).json({ vendor: updatedVendor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error updating vendor" });
    }
});

// Page 3: Delivery Address

// Get vendor by user ID
router.get("/user-id/:userId", async (req, res) => {
    console.log("routes/vendor::: GET /user-id/:userId",{ userId: req.params.userId });
    try {
        const vendor = await Vendor.findOne({ userId: req.params.userId });
        console.log({vendorId: vendor._id, userId: vendor.userId})
        if (!vendor) {
            console.log("No vendor found for this user");
            return res
                .status(404)
                .json({ message: "No vendor found for this user" });
        }
        res.json(vendor);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Update delivery address for a vendor
router.patch("/profile-form/delivery", async (req, res) => {
    console.log("routes/vendor::: PATCH /profile-form/delivery");
    try {
        const { address1, address2, city, zipCode } = req.body;
        const userId = req.user.userId; // Corrected line
        const vendor = await Vendor.findOne({ userId });

        if (!vendor) {
            return res
                .status(404)
                .json({ message: "No vendor found for this user" });
        }

        vendor.deliveryAddress = { address1, address2, city, zipCode };
        await vendor.save();
        res.json(vendor);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

function isDuplicateBankAccount(vendor, newBank) {
    const lastBankAccount = vendor.bankHistory[vendor.bankHistory.length - 1];
    const isDuplicate =
        lastBankAccount &&
        lastBankAccount.accountName === newBank.accountName &&
        lastBankAccount.accountNumber === newBank.accountNumber &&
        lastBankAccount.bankName === newBank.bankName;
    return isDuplicate;
}

// save bank account as pending bank account
router.patch("/profile-form/bank", async (req, res) => {
    console.log("routes/vendor::: PATCH /profile-form/bank");
    const userId = req.user.userId;
    const { bankName, accountNumber, accountName } = req.body;
    const newBank = { bankName, accountNumber, accountName };
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
        console.error(`Vendor not found for userId ${userId}`);
        return res
            .status(404)
            .json({ error: `Vendor not found for user id ${userId}` });
    }
    if (isDuplicateBankAccount(vendor, newBank)) {
        console.error("duplicate bank account");
        return res.status(400).json({ error: `Duplicate bank account` });
    }
    try {
        if (!vendor?.pending) {
            vendor.pending = {};
        }
        if (!vendor.pending?.bank) {
            vendor.pending.bank = {};
        }
        vendor.pending.bank = {
            bankName,
            accountNumber,
            accountName,
        };
        await vendor.save();
        res.status(200).json({ vendor });
    } catch (error) {
        console.error("catch error::: ", error);
        res.status(500).json({ error: "Server error updating vendor" });
    }
});

// save image of registration document as pending document
router.patch(
    "/profile-form/registration-document",
    uploadImage.single("document"),
    async (req, res) => {
        console.log("routes/vendor::: DELETE PATCH /profile-form/registration-document");

        const userId = req.user.userId;
        let documentFilePath = req?.file?.path;

        if (!documentFilePath) {
            console.error("\n No document file provided", { file: req?.file });
            return res.status(400).json({ error: "No document file provided" });
        }

        const vendor = await Vendor.findOne({ userId });
        if (!vendor) {
            return res
                .status(404)
                .json({ error: `Vendor not found for userId ${userId}` });
        }

        try {
            const documentS3KeyWord = `${userId}-document`;
            const newDocument = { file: fs.readFileSync(documentFilePath) };
            const { key: s3Key } = await uploadProfileToS3(
                newDocument,
                documentS3KeyWord
            );

            // Store the pending document
            vendor.pending.document = {
                s3Key,
                uploadedAt: new Date(),
            };
            await vendor.save();
            res.status(200).json({ vendor });
        } catch (error) {
            console.error("regg::", { error });
            res.status(500).json({ error: "Server error updating vendor" });
        } finally {
            deleteFile(documentFilePath);
        }
    }
);

// DEBUG delete pending bank details
router.delete("/bank-account/pending/:userId", async (req, res) => {
    console.log("routes/vendor::: DELETE /bank-account/pending/:userId");
    try {
        const userId = req.params.userId;
        const vendor = await Vendor.findOne({ userId });

        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found" });
        }

        // Delete the pending bank details
        vendor.pending.bank = undefined;

        await vendor.save();
        res.status(200).json({ vendor });
    } catch (error) {
        console.error("catch error::: ", error);
        res.status(500).json({
            error: "Server error deleting vendor's bank details",
        });
    }
});

// DEBUG delete pending document
router.delete("/bank-account/history/:userId", async (req, res) => {
    console.log("routes/vendor::: DELETE /bank-account/history/:userId");
    try {
        const userId = req.params.userId;
        const vendor = await Vendor.findOne({ userId });

        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found" });
        }

        // Delete bank history array leaving current bank account
        
        // Check if current bank account exists
        if (vendor.bank.accountName || vendor.bank.accountNumber || vendor.bank.bankName) {
            // Replace bank history array with current bank account
            vendor.bankHistory = [vendor.bank];
        } else {
            // Delete bank history array
            vendor.bankHistory = [];
        }

        await vendor.save();
        res.json({ message: "Bank history deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error deleting bank history" });
    }
});

// Get document history

router.get("/document-history/:userId", async (req, res) => {
    console.log("routes/vendor::: GET document-history/:userId");
    try {
        const userId = req.params.userId;
        const vendor = await Vendor.findOne({ userId });

        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found" });
        }

        res.json({ documentHistory: vendor.documentHistory });
    } catch (err) {
        res.status(500).json({
            error: "Server error retrieving document history",
        });
    }
});

const NULL_BANK_ACCOUNT = {
        accountName: "",
        accountNumber: "",
        bankName: "",
        uploadedAt: null,
        approvedAt: null
}
// promote pending bank account to current bank account
router.patch("/bank-account/pending/:userId/approve", async (req, res) => {
    console.log("routes/vendor::: PATCH /bank-account/pending/:userId/approve");
    const userId = req.params.userId;
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
        return res.status(404).json({ error: "No vendor found for this user" });
    }
    const pending = vendor?.pending;
    if (!pending?.bank) {
        return res
            .status(404)
            .json({ error: "No pending bank details found for this user" });
    }
    if (
        pending.bank.accountName &&
        pending.bank.accountNumber &&
        pending.bank.bankName
    ) {
        // Move current bank account to bank history
        vendor.bankHistory.push({
            ...vendor.bank,
        });

        // Approve pending bank account to be current bank account and add approval date
        vendor.bank = {
            ...pending.bank,
            approvedAt: new Date(),
        };

        // Clear pending bank account
        pending.bank = { ...NULL_BANK_ACCOUNT };

        try {
            await vendor.save();
            return res
                .status(200)
                .json({ message: "Bank account approved successfully" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "An error occurred while approving the bank account",
            });
        }
    } else {
        return res
            .status(400)
            .json({ error: "No pending bank account to approve" });
    }
});

// Promote pending document to current document
router.patch("/document/pending/:userId/approve", async (req, res) => {
    console.log("routes/vendor::: PATCH '/document/pending/:userId/approve'");
    const userId = req.params.userId;
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
        return res.status(404).json({ error: "No vendor found for this user" });
    }
    if (!vendor?.pending?.document) {
        return res.status(404).json({ error: "No pending document found" });
    }
    const approvedDocument = { ...vendor.pending.document,  approvedAt: new Date() };
    // Approve the pending document
    vendor.document = approvedDocument;
    vendor.documentHistory.push( approvedDocument );
    vendor.pending.document = null;
    await vendor.save();
    res.status(200).send({ message: "Document approved successfully" });
});

// delete document history
router.delete("/document-history/:userId", async (req, res) => {
    console.log("routes/vendor::: DELETE('/document-history/:userId");
    try {
        const userId = req.params.userId;
        const vendor = await Vendor.findOne({ userId });

        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found" });
        }

        const currentDocument = vendor.document;

        // Delete documents from S3 bucket
        for (const doc of vendor.documentHistory) {
            // Skip the current document
            if (doc.approvedAt.getTime() === currentDocument.approvedAt.getTime()) {
                continue;
            }
            if (doc.s3Key) {
                await deleteUrl(doc.s3Key);
            } else {
                console.log("no s3Key", { doc });
            }
        }

        // Delete document history array
        vendor.documentHistory = [currentDocument];

        await vendor.save();
        res.json({ message: "Document history deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Server error deleting document history",
        });
    }
});

// Route to get all vendors with populated user details
router.get("/all", async (req, res) => {
    try {
        const vendorsPopulated = await Vendor.find()
            .populate("userId", "name username image email")
            // .lean();

        const vendorsWithUserDetails = vendorsPopulated.map(vendor => {
            // Explicitly handle the case where userId is null after population
            const isUserIdValid = vendor.userId !== null;

            return {
                // .toJSON() is needed whenever we modify the object directly, as below.
                ...vendor.toJSON(),
                user: isUserIdValid ? {
                    name: vendor.userId.name,
                    username: vendor.userId.username,
                    image: vendor.userId.image,
                    email: vendor.userId.email,
                } : null, // Set user to null if userId refers to user that does not exist
                // Keep the original userId reference, even if it wasn't populated
                userId: vendor.userId?._id ?? null,
            };
        });

        res.json(vendorsWithUserDetails);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
