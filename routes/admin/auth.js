const { register, login, requestProfile } = require('../../controllers/admin/auth');
const express = require('express');
const router = express.Router();
const { validateRegisterRequest, validateLoginRequest, isRequestValidated } = require('../../validators/auth');
const { requireSignin } = require('../../common-middleware/')

router.post('/login', validateLoginRequest, isRequestValidated, login);
router.post('/register', validateRegisterRequest, isRequestValidated, register);

router.post('/profile', requireSignin, requestProfile);


module.exports = router;