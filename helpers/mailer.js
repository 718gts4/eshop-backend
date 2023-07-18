const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'contact@voutiq.co.kr',
        password: process.env.MY_PASSWORD,
    },
});

module.exports = transporter ;