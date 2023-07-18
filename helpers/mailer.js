const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'contact@voutiq.co.kr',
      pass: 'G@frong!2',
    },
  });
  
  module.exports = transporter;