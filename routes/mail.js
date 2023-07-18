const express = require('express');
const router = express.Router();


router.get("/test", async (req, res) => {
    console.log('test console', req.body)
});

module.exports = router;