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
    
exports.generateEmailTemplate = code => {
    return `
        <!DOCTYPE html>
        <html lang="kr">
        <head>
            <meta charset="UTF-8">
            <meat http-equiv="X-UA-Compatible" content="IE=edge">
            <style>
            @media only screen and (max-width: 620px){
                h1 {
                    font-size: 20px;
                    padding: 5px;
                }
            }
            </style>
        </head>
        <body>
        <div>
            <div style="max-width: 620px; margin: 0 auto; font-family: sans-serif; color:#272727;">
                <h1 style="background: #f6f6f6; padding: 10px; text-align: center; color: #272727;">환영합니다!</h1>
                <p>4자리 PIN 번호를 확인 후 앱에 입력하세요</p>
                <p style="width: 80px; margin: 0 auto; font-weight: bold; text-align: center; background: #f6f6f6; border-radius: 5px; font-size: 25px;"
                >${code}</p>
            </div>
        </div>
        </body>
        </html>
    `;
};