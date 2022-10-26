const { register, login, requireSignin } = require('../../controllers/admin/auth');
const express = require('express');
const router = express.Router();
const { validateRegisterRequest, validateLoginRequest, isRequestValidated } = require('../../validators/auth');


router.post('/login', validateLoginRequest, isRequestValidated, login);
router.post('/register', validateRegisterRequest, isRequestValidated, register);

router.post('/profile', requireSignin, async (req, res) => {
    res.status(200).json({user: req.user});
})

module.exports = router;