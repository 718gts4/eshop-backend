require("dotenv").config();
const mongoose = require("mongoose");
const { Vendor } = require("../models/vendor");

mongoose
    .connect(process.env.CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB", err));

async function migrateData() {
    const vendors = await Vendor.find({}).lean();

    const savePromises = vendors.map((vendor) => {
        /*
            convert the following fields to the new schema:
            vendor:{
                document:"string"
            } 
            to 
            vendor:{
                document:{            
                    s3Key: { type: String },
                    uploadedAt: { type: Date },
                    approvedAt: { type: Date },
                }
            }



        */
        // Refactor vendor.document
        if (typeof vendor.document === "string") {
            vendor.document = {
                s3Key: vendor.document,
                uploadedAt: Date.now(),
            };
        }

        // Refactor vendor.pending.document
        if (vendor.pending && typeof vendor.pending.document === "string") {
            vendor.pending.document = {
                s3Key: vendor.pending.document,
                uploadedAt: Date.now(),
            };
        }

        // Refactor vendor.documentHistory
        if (vendor.documentHistory) {
            vendor.documentHistory = vendor.documentHistory.map((doc) => {
                if (typeof doc === "string") {
                    return {
                        s3Key: doc,
                        uploadedAt: Date.now(),
                    };
                }
                return doc;
            });
        }

        // Refactor vendor.bank
        if (vendor.bankName || vendor.bankAccount || vendor.bankOwner) {
            console.log({
                bankName: vendor.bankName,
                bankAccount: vendor.bankAccount,
                bankOwner: vendor.bankOwner,
            });
            vendor.bank = {
                bankName: vendor.bankName || "default Bank Name",
                accountNumber:
                    vendor.bankAccount || "default Bank Account 0001234",
                accountName: vendor.bankOwner || "default Bank Owner",
            };

            // delete vendor.bankName;
            // delete vendor.bankAccount;
            // delete vendor.bankOwner;
        }

        // Remove unnecessary fields
        // delete vendor.email;
        // delete vendor.profileImg;
        // delete vendor.brandName;
        // delete vendor.phone;

        const update = {
            $set: {
                document: vendor.document,
                pending: vendor.pending,
                documentHistory: vendor.documentHistory,
                bank: vendor.bank,
            },
            $unset: {
                bankName: 1,
                bankAccount: 1,
                bankOwner: 1,
                email: 1,
                profileImg: 1,
                brandName: 1,
                phone: 1,
                username: 1,
            },
        };
        // Update the existing document
        return Vendor.updateOne({ _id: vendor._id }, update)
        .then(() => Vendor.findById(vendor._id).lean())
        // .then(updatedVendor => console.log(updatedVendor))
        .catch((err) => console.error("Error updating vendor:", err));
    });

    // Wait for all save promises to resolve
    await Promise.all(savePromises);
    console.log("All vendors updated");
}

migrateData();
