const express = require('express');
const transporter = require('../helpers/mailer');
const router = express.Router();

router.post("/recoverpassword", async (req, res) => {
    const { email } = req.body;
    console.log('email', email);

    const mailOptions = {
        from: 'contact@voutiq.co.kr',
        to: email,
        subject: 'Password Reset',
        text: 'You are receiving this email because you requested a password reset. Click the link below to reset your password.',
        html: `<a href="https://your-app.com/reset-password/">Reset Password</a>`,
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error occurred:', error.message);
        } else {
          console.log('Email sent successfully:', info.response);
        }
    });
});

module.exports = router;