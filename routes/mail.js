const express = require('express');
const transporter = require('../helpers/mailer');
const router = express.Router();

router.post("/test", async (req, res) => {
    console.log('test console', req.body)
});

module.exports = router;