const express = require('express');
const router = express.Router();
const { requireSignin } = require('../common-middleware');
const {getUserCard, updateCard, deleteCard, createCard, updateDefaultCard} = require('../controllers/card')

const crypto = require('crypto');
const transporter = require('../helpers/mailer');

router.get('/:id', getUserCard, requireSignin);
router.post('/:id', createCard, requireSignin);
router.put('/:id', updateCard, requireSignin);
router.delete('/:id', deleteCard, requireSignin);
router.put(`/updatedefault/:id`, updateDefaultCard, requireSignin);


router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log('CHEKCING')
console.log('email', email)

    // const mailOptions = {
    //     from: 'contact@voutiq.co.kr',
    //     to: email,
    //     subject: '비밀번호 재설정',
    //     text: '비밀번호 재설정을위해 이메일을 전해드립니다. 아래 링크를 클릭해서 이메일 비밀번호를 재설정하세요.',
    //     html: `<a href="https://boutiq-shop-server.herokuapp.com/api/v1/mailer/reset-password/">비번 재설정</a>`,
    // };

    // try {
    //     await transporter.sendMail(mailOptions);
    //     res.status(200).json({message:'비밀번호 재설정 이메일이 발송되었습니다.'});
    // } catch (error) {
    //     console.log(error);
    //     res.status(500).json({error: '비밀번호 재설정 이메일 발송에 문재가 발생했습니다.'});
    // }
});


module.exports = router;