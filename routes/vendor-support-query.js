const express = require('express');
const router = express.Router();
const {
  addMessage,
  createVendorSupportQuery,
  getUserVendorSupportQueries,
  getVendorSupportQueriesByUser,
  getVendorSupportQuery,
  markMessagesAsRead,
  getAllVendorSupportQueriesForSuperAdmin
} = require('../controllers/vendor-support-query');
const authJwt = require('../helpers/jwt');

router.post('/', authJwt(), createVendorSupportQuery);
router.get('/', authJwt(), getUserVendorSupportQueries);          
router.get('/all', authJwt(), getAllVendorSupportQueriesForSuperAdmin);
// :queryId in these routes refers to the VendorSupportQuery ID
router.get('/:queryId', authJwt(), getVendorSupportQuery);
router.post('/:queryId', authJwt(), addMessage);
router.get('/user/:userId', authJwt(), getVendorSupportQueriesByUser);
router.post('/:queryId/read', authJwt(), markMessagesAsRead);

module.exports = router;
