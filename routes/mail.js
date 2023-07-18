const express = require('express');
const transporter = require('../helpers/mailer');
const router = express.Router();

router.post("/test", async (req, res) => {
    const { email } = req.body
    console.log('email', email)
});

module.exports = router;