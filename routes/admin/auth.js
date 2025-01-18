const { register, login, requestProfile } = require('../../controllers/admin/auth');
const express = require('express');
const router = express.Router();
const { validateRequest } = require('../../middleware/validate-zod');
const { authSchema, registerSchema } = require('../../validators/schemas/auth');
const { requireSignin } = require('../../common-middleware/')

router.post('/login', validateRequest(authSchema), login);
router.post('/register', validateRequest(registerSchema), register);

router.post('/profile', requireSignin, requestProfile);

module.exports = router;