const express = require('express');
const router = express.Router();
const {
  createSupportQuery,
  getSupportQueries,
  getVendorSupportQuery,
  markSupportQueryAsRead,
  getAllSupportQueries,
  getAdminUserSupportQueries,
  deleteSupportQuery
} = require('../controllers/vendor-support-query');
const authJwt = require('../helpers/jwt');

router.post('/', authJwt(), createSupportQuery);
router.get('/', authJwt(), getSupportQueries);
router.get('/all', authJwt(), getAllSupportQueries);
router.get('/:queryId', authJwt(), getVendorSupportQuery);
router.get('/user/:userId', authJwt(), getAdminUserSupportQueries);
router.post('/:queryId/read', authJwt(), markSupportQueryAsRead);
router.delete('/:queryId', authJwt(), deleteSupportQuery);

module.exports = router;
