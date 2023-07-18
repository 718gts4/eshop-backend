const express = require('express');
const transporter = require('../helpers/mailer');
const router = express.Router();

router.post("/test", async (req, res) => {
    const { email } = req.body;
    console.log('email', email);

    const mailOptions = {
        from: 'contact@voutiq.co.kr',
        to: email,
        subject: 'Password Reset',
        text: 'You are receiving this email because you requested a password reset. Click the link below to reset your password.',
        html: `<a href="https://your-app.com/reset-password/">Reset Password</a>`,
    };
    
    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send password reset email' });
    };
});

module.exports = router;