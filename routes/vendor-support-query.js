const express = require('express');
const router = express.Router();
const {
  addMessage,
  createVendorSupportQuery,
  getAllVendorSupportQueries,
  getVendorSupportQueriesByUser,
  getVendorSupportQuery,
  markMessagesAsRead,
  getVendorSupportQueryMessages,
} = require('../controllers/vendor-support-query');
const authJwt = require('../helpers/jwt');

router.post('/', authJwt(), createVendorSupportQuery);
router.get('/', authJwt(), getAllVendorSupportQueries);          
router.get('/messages', authJwt(), getVendorSupportQueryMessages);
router.get('/:id', authJwt(), getVendorSupportQuery);
router.post('/:id/messages', authJwt(), addMessage);
router.get('/user/:userId', authJwt(), getVendorSupportQueriesByUser);
router.post('/:id/read', authJwt(), markMessagesAsRead);

module.exports = router;
