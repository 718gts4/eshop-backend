const { register, login, getUsers, getUserId, postNewUser, deleteUser, getUserCount } = require('../controllers/user');
const express = require('express');
const router = express.Router();

router.get('/', getUsers);
router.get('/:id', getUserId);
router.post(`/`, postNewUser);
router.post('/login', login);
router.post('/register', register);
router.delete(`/:id`, deleteUser);
router.get(`/get/count`, getUserCount);



module.exports = router;