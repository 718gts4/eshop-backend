const express = require('express');
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');
const {getReturnBank, createReturnBank, updateReturnBank, deleteReturnBank} = require('../controllers/returnBank')

router.get('/:id', getReturnBank);
router.post('/:id', createReturnBank, requireSignin);
router.put('/:id', updateReturnBank, requireSignin);
router.delete('/:id', deleteReturnBank, requireSignin);

module.exports = router;