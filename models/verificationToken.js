const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const verificationTokenSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        expires: 3600,
        default: Date.now()
    }
})

verificationTokenSchema.pre("save", async function(next){
    if(this.isModified("token")){
        this.token = await bcrypt.hash(this.token, 10);
    }
    next();
});

verificationTokenSchema.method.compareToken = async function(token) {
    const result = await bcrypt.compareSync(token, this.token);
    return result;
};

module.exports = mongoose.model( "VerificationToken", verificationTokenSchema);

// exports.VerificationToken = mongoose.model('VerificationToken', verificationTokenSchema);