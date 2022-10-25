const { register, login, requireSignin } = require('../../controllers/admin/auth');
const express = require('express');
const router = express.Router();


router.post('/login', login);
router.post('/register', register);

router.post('/profile', requireSignin, async (req, res) => {
    res.status(200).json({user: req.user});
})

module.exports = router;