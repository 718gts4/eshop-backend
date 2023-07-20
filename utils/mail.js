const nodemailer = require('nodemailer');

exports.generateOTP = () => {
    let otp = '';
    for(let i = 0; i <= 3; i++){
        const randVal = Math.round(Math.random() * 9)
        otp = otp + randVal
    }
    return otp;
};

exports.mailTransport = () => 
    nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        }
});
    



// const { userEmail } = req.body;

// let config = {
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASSWORD,
//     }
// }

// let transporter = nodemailer.createTransport(config);

// let message = await transporter.sendMail({
//     from: process.env.EMAIL, // sender address
//     to: userEmail, // list of receivers
//     subject: "VOUTIQ 비밀번호 재설정 이메일입니다.", // Subject line
//     text: "안녕하세요", // plain text body
//     html: "<p>VOUTIQ 비밀번호 재설정을위해 아래 링크를 클릭해주시기 바랍니다.</p>", // html body
// });

// transporter.sendMail(message).then((info) => {
//     return res.status(201).json({
//         message: "You've got mail",
//         info: info.messageId,
//         preview: nodemailer.getTestMessageUrl(info)
//     })
// }).catch(error => {
//     return res.status(500).json({ error })
// })  