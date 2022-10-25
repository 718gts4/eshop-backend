const { register, login, requireSignin } = require('../../controllers/admin/auth');
const express = require('express');
const router = express.Router();


router.post('/login', login);
router.post('/register', register);


module.exports = router;