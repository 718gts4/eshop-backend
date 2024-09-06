const express = require('express');
const router = express.Router();
const {
  addMessage,
  createVendorSupportQuery,
  getUserVendorSupportQueries,
  getVendorSupportQueriesByUser,
  getVendorSupportQuery,
  markMessagesAsRead,
  getAllVendorSupportQueryMessages,
  getAllVendorSupportQueriesForSuperAdmin
} = require('../controllers/vendor-support-query');
const authJwt = require('../helpers/jwt');

router.post('/', authJwt(), createVendorSupportQuery);
router.get('/', authJwt(), getUserVendorSupportQueries);          
router.get('/messages', authJwt(), getAllVendorSupportQueryMessages);
router.get('/all', authJwt(), getAllVendorSupportQueriesForSuperAdmin);
router.get('/:id', authJwt(), getVendorSupportQuery);
router.post('/:id/messages', authJwt(), addMessage);
router.get('/user/:userId', authJwt(), getVendorSupportQueriesByUser);
router.post('/:id/read', authJwt(), markMessagesAsRead);

module.exports = router;
