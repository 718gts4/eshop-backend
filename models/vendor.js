const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
    {
        bank: {
            accountName: { type: String, required: true },
            accountNumber: { type: Number, required: true },
            bankName: { type: String, required: true },
        },
        bankHistory: [
            {
                accountName: { type: String },
                accountNumber: { type: Number },
                bankName: { type: String },
                updatedAt: { type: Date },
            },
        ],
        document: {
            type: String,
            default: "",
        },
        documentHistory: [
            {
                document: { type: String },
                updatedAt: { type: Date },
            },
        ],
        clients: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        confirmed: {
            type: Boolean,
            default: false,
        },
        contacts: {
            store: {
                email: { type: String },
                mobile: { type: String },
                name: { type: String },
                phone: { type: String },
            },
            customerService: {
                contactNumber: { type: String },
                name: { type: String },
                sameAsStoreManager: { type: Boolean, default: false },
            },
            finance: {
                email: { type: String },
                mobile: { type: String },
                name: { type: String },
            },
        },
        deliveryAddress: {
            address1: { type: String },
            address2: { type: String },
            city: { type: String },
            zipCode: { type: String },
        },
        pending: {
            document: { type: String, default: "" },
            bank: {
                accountName: { type: String, default: "" },
                accountNumber: { type: Number, default: "" },
                bankName: { type: String, default: "" },
            },
        },
        submitted: {
            type: Boolean,
            default: false,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

vendorSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

vendorSchema.set("toJSON", {
    virtuals: true,
});

vendorSchema.virtual("isPendingBank").get(function () {
    return Boolean(
        this.pending.bank &&
            this.pending.bank.accountName &&
            this.pending.bank.accountNumber &&
            this.pending.bank.bankName
    );
});

// exports.Vendor = mongoose.model("Vendor", vendorSchema);
const Vendor = mongoose.model("Vendor", vendorSchema);

module.exports = { Vendor };
