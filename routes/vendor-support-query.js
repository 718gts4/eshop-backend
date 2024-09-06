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
// :id in both routes refers to the VendorSupportQuery ID
router.get('/:id', authJwt(), getVendorSupportQuery);
router.post('/:id', authJwt(), addMessage);
router.get('/user/:userId', authJwt(), getVendorSupportQueriesByUser);
router.post('/:id/read', authJwt(), markMessagesAsRead);

module.exports = router;
