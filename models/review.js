const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
            default: "",
        },
        point: {
            type: Number,
            default: 5,
        },
        read: {
            type: Boolean,
            default: false,
        },
        visible: {
            type: Boolean,
            default: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

reviewSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

reviewSchema.set("toJSON", {
    virtuals: true,
});

exports.Review = mongoose.model("Review", reviewSchema);
