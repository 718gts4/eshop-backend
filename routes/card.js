const express = require('express');
const router = express.Router();
const { requireSignin } = require('../common-middleware');
const {getUserCard, updateCard, deleteCard, createCard, updateDefaultCard} = require('../controllers/card')

router.get('/:id', getUserCard, requireSignin);
router.post('/:id', createCard, requireSignin);
router.put('/:id', updateCard, requireSignin);
router.delete('/:id', deleteCard, requireSignin);
router.put(`/updatedefault/:id`, updateDefaultCard, requireSignin);

module.exports = router;