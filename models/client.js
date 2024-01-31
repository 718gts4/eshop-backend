const mongoose = require("mongoose");

const clientSchema = mongoose.Schema(
    {
        clients: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

exports.Client = mongoose.model("Client", clientSchema);
