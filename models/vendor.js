const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
    {
        // commented because brand is saved in User model
        // brandName: {
        //     type: String,
        //     required: true,
        // },
        email: {
            type: String,
            required: true,
        },
        // commented because phone is saved in User model
        // phone: {
        //     type: String,
        //     required: true,
        // },
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
        clients: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        contacts: { // store manager, customer service, finance
            store: {
                name: { type: String },
                email: { type: String },
                mobile: { type: String },
                phone: { type: String },
            },
            customerService: {
                name: { type: String },
                contactNumber: { type: String },
                sameAsStoreManager: { type: Boolean, default: false },
            },
            finance: {
                name: { type: String },
                email: { type: String },
                mobile: { type: String },
            },
        },
        deliveryAddress: {
            address1: { type: String },
            address2: { type: String },
            city: { type: String },
            zipCode: { type: String },
        },
        // possible to move bank details 
        //     - bankName
        //     - bankAccount
        //     - bankOwner 
        // from vendor root level to here
        // bank: {
        //     bankName: { type: String },
        //     accountNumber: { type: String },
        //     accountName: { type: String },
        // },
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
