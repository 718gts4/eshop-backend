const mongoose = require("mongoose");
const { vendorSchema } = require("./vendor");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        default: "",
    },
    image: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    username: {
        type: String,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: "",
    },
    gender: {
        type: String,
        default: "none",
    },
    birthday: {
        type: String,
        default: "",
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: ["user", "admin", "superAdmin"],
        default: "user",
    },
    brand: {
        type: String,
        default: "",
    },
    brandDescription: {
        type: String,
        default: "",
    },
    likes: {
        type: Map,
        of: Boolean,
    },
    bookmarkProducts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: [],
        },
    ],
    savedVideos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
    ],
    savedProducts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
    ],
    followers: {
        type: Map,
        of: Boolean,
    },
    following: {
        type: Map,
        of: Boolean,
    },
    videos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
    ],
    adresses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address",
        },
    ],
    searchWords: {
        type: [String],
        default: [],
    },
    verified: {
        type: Boolean,
        default: false,
    },
    checkForAdminRegistration: {
        type: Boolean,
        default: false,
    },
    submitted: {
        type: Boolean,
        default: false,
    },
    resettoken: {
        type: String, 
        required: false,
    },
    resettokenExpiration: {
        type: Date,
        required: false,
    },
    vendor: vendorSchema,
    vendorSupportQueries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VendorSupportQuery'
    }],
    adminVerified: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

userSchema.pre("save", function (next) {
    if (!this.username) {
        this.username = this.email;
    }
    next();
});

userSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

userSchema.set("toJSON", {
    virtuals: true,
});

const User = mongoose.model("User", userSchema);
module.exports = { User, userSchema };
