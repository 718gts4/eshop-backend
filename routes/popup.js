const express = require('express');
const router = express.Router();
const { requireSignin } = require('../common-middleware');
const {getPopup, getPopups, deletePopup, updatePopup} = require('../controllers/popup')

router.get('/', getPopups);
router.get('/:id', getPopup, requireSignin);
router.put('/:id', updatePopup, requireSignin);
router.delete('/:id', deletePopup, requireSignin);

module.exports = router;