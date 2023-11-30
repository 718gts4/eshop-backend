const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
    {
        profileImg: {
            type: String,
            default: "",
        },
        brandName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        bankName: {
            type: String,
            required: true,
        },
        bankAccount: {
            type: Number,
            required: true,
        },
        bankOwner: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        document: {
            type: String,
            default: "",
        },
        submitted: {
            type: Boolean,
            default: false,
        },
        confirmed: {
            type: Boolean,
            default: false,
        },
    },
    { timestaps: true }
);

vendorSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

vendorSchema.set("toJSON", {
    virtuals: true,
});

// exports.Vendor = mongoose.model("Vendor", vendorSchema);
const Vendor = mongoose.model("Vendor", vendorSchema);

module.exports = { Vendor };
