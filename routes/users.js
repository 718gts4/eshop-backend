const { register, login, getUsers, getUserId, postNewUser, deleteUser, getUserCount, requireSignin } = require('../controllers/user');
const express = require('express');
const router = express.Router();
const { validateRegisterRequest, validateLoginRequest, isRequestValidated } = require('../validators/auth');

router.get('/', getUsers);
router.get('/:id', getUserId);
router.post(`/`, postNewUser);
router.post('/login', validateLoginRequest, isRequestValidated, login);
router.post('/register', validateRegisterRequest, isRequestValidated, register);
router.delete(`/:id`, deleteUser);
router.get(`/get/count`, getUserCount);

router.post('/profile', requireSignin, (req, res)=>{
    res.status(200).json({user: 'profile'})
});

module.exports = router;