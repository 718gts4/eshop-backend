const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const transporter = nodemailer.createTransport(
    smtpTransport({
        service: 'Gmail',
        auth: {
        user: 'contact@voutiq.co.kr',
        pass: 'G@frong!2',
        },
    })
  );
  
  module.exports = transporter;