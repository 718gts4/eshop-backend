const express = require("express");
const router = express.Router();
const {
    uploadProfileToS3,
    deleteFileFromS3,
    deleteFile,
    deleteUrl,
} = require("../s3");
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

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("사용자를 찾을 수 없습니다");
        }

        user.vendor = {
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
        };

        user.image = imageKey;
        user.brand = brandName;
        user.phone = phone;
        user.submitted = true;
        user.followers = {};
        user.following = {};
        user.likes = {};
        user.role = "admin";

        await user.save({ validateBeforeSave: false });

        res.status(201).json({ vendor: user.vendor });
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
            updatedUser.$ignore = ["passwordHash", "email"];
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

        const user = await User.findById(userId);
        if (!user || !user.vendor) {
            return res
                .status(404)
                .json({ error: `Vendor information not found for userId ${userId}` });
        }

        user.vendor = {
            ...user.vendor,
            contacts: {
                store: contacts.store,
                customerService: contacts.customerService,
                finance: contacts.finance
            }
        };

        await user.save();

        res.status(200).json({ vendor: user.vendor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error updating vendor" });
    }
});

// Page 3: Delivery Address

// Get vendor by user ID
router.get("/user-id/:userId", async (req, res) => {
    console.log("routes/vendor::: GET /user-id/:userId", { userId: req.params.userId });
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            console.log("No user found with this ID");
            return res.status(404).json({ message: "No user found with this ID" });
        }
        if (!user.vendor) {
            console.log("No vendor information found for this user");
            return res.status(404).json({ message: "No vendor information found for this user" });
        }
        console.log({ vendorId: user.vendor._id, userId: user._id });
        res.json(user.vendor);
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
        const user = await User.findById(userId);

        if (!user || !user.vendor) {
            return res
                .status(404)
                .json({ message: "No vendor found for this user" });
        }

        user.vendor.deliveryAddress = { address1, address2, city, zipCode };
        await user.save();
        user.$ignore = ["passwordHash", "email"];
        res.json(user.vendor);
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
    const user = await User.findOne({ _id: userId });
    const vendor = user ? user.vendor : null;
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
        if (!user.vendor) {
            user.vendor = {};
        }
        if (!user.vendor.pending) {
            user.vendor.pending = {};
        }
        if (!user.vendor.pending.bank) {
            user.vendor.pending.bank = {};
        }
        user.vendor.pending.bank = {
            bankName,
            accountNumber,
            accountName,
        };
        await user.save();
        user.$ignore = ["passwordHash", "email"];
        res.status(200).json({ vendor: user.vendor });
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

        const user = await User.findById(userId);
        if (!user || !user.vendor) {
            return res
                .status(404)
                .json({ error: `Vendor information not found for userId ${userId}` });
        }

        try {
            const documentS3KeyWord = `${userId}-document`;
            const newDocument = { file: fs.readFileSync(documentFilePath) };
            const { key: s3Key } = await uploadProfileToS3(
                newDocument,
                documentS3KeyWord
            );

            // Store the pending document
            if (!user.vendor.pending) {
                user.vendor.pending = {};
            }
            user.vendor.pending.document = {
                s3Key,
                uploadedAt: new Date(),
            };
            await user.save();
            res.status(200).json({ vendor: user.vendor });
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
        const user = await User.findById(userId);

        if (!user || !user.vendor) {
            return res.status(404).json({ error: "Vendor information not found" });
        }

        // Delete the pending bank details
        if (user.vendor.pending) {
            user.vendor.pending.bank = undefined;
        }

        await user.save();
        res.status(200).json({ vendor: user.vendor });
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
        const user = await User.findById(userId);

        if (!user || !user.vendor) {
            return res.status(404).json({ error: "Vendor information not found" });
        }

        // Delete bank history array leaving current bank account
        
        // Check if current bank account exists
        if (user.vendor.bank && (user.vendor.bank.accountName || user.vendor.bank.accountNumber || user.vendor.bank.bankName)) {
            // Replace bank history array with current bank account
            user.vendor.bankHistory = [user.vendor.bank];
        } else {
            // Delete bank history array
            user.vendor.bankHistory = [];
        }

        await user.save();
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
        const user = await User.findById(userId);

        if (!user || !user.vendor) {
            return res.status(404).json({ error: "Vendor information not found" });
        }

        res.json({ documentHistory: user.vendor.documentHistory });
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
    const user = await User.findById(userId);
    if (!user || !user.vendor) {
        return res.status(404).json({ error: "No vendor information found for this user" });
    }
    const pending = user.vendor?.pending;
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
        if (!user.vendor.bankHistory) {
            user.vendor.bankHistory = [];
        }
        if (user.vendor.bank) {
            user.vendor.bankHistory.push({
                ...user.vendor.bank,
            });
        }

        // Approve pending bank account to be current bank account and add approval date
        user.vendor.bank = {
            ...pending.bank,
            approvedAt: new Date(),
        };

        // Clear pending bank account
        pending.bank = { ...NULL_BANK_ACCOUNT };

        try {
            await user.save();
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
    const user = await User.findById(userId);
    if (!user || !user.vendor) {
        return res.status(404).json({ error: "No vendor information found for this user" });
    }
    if (!user.vendor?.pending?.document) {
        return res.status(404).json({ error: "No pending document found" });
    }
    const approvedDocument = { ...user.vendor.pending.document,  approvedAt: new Date() };
    // Approve the pending document
    user.vendor.document = approvedDocument;
    if (!user.vendor.documentHistory) {
        user.vendor.documentHistory = [];
    }
    user.vendor.documentHistory.push( approvedDocument );
    user.vendor.pending.document = null;
    await user.save();
    res.status(200).send({ message: "Document approved successfully" });
});

// delete document history
router.delete("/document-history/:userId", async (req, res) => {
    console.log("routes/vendor::: DELETE('/document-history/:userId");
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user || !user.vendor) {
            return res.status(404).json({ error: "Vendor information not found" });
        }

        const currentDocument = user.vendor.document;

        // Delete documents from S3 bucket
        for (const doc of user.vendor.documentHistory || []) {
            // Skip the current document
            if (doc.approvedAt && currentDocument && doc.approvedAt.getTime() === currentDocument.approvedAt.getTime()) {
                continue;
            }
            if (doc.s3Key) {
                await deleteUrl(doc.s3Key);
            } else {
                console.log("no s3Key", { doc });
            }
        }

        // Delete document history array
        user.vendor.documentHistory = currentDocument ? [currentDocument] : [];

        await user.save();
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
        const users = await User.find({ 'vendor': { $exists: true } })
            .select('name username image email vendor');

        const vendorsWithUserDetails = users.map(user => {
            user.$ignore = ["passwordHash"];
            return {
                ...user.vendor.toJSON(),
                user: {
                    name: user.name,
                    username: user.username,
                    image: user.image,
                    email: user.email,
                },
                userId: user._id,
            };
        });

        res.json(vendorsWithUserDetails);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
