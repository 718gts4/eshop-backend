const express = require('express');
const router = express.Router();
const { requireSignin } = require('../common-middleware');
const {getPopup, getPopups, deletePopup, updatePopup, postPopup} = require('../controllers/popup')

router.get('/', getPopups);
router.post('/', postPopup);
router.get('/:id', getPopup, requireSignin);
router.put('/:id', updatePopup, requireSignin);
router.delete('/:id', deletePopup, requireSignin);

module.exports = router;