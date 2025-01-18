const express = require('express');
const { requireSignin, adminMiddleware, superAdminMiddleware } = require('../common-middleware');
const { 
    createAdminQuery, 
    getAdminQuery, 
    getMyAdminQueries,
    getAllAdminQueries,
    addMessage, 
    deleteAdminQuery,
    markMessageRead
} = require('../controllers/admin-query');

const router = express.Router();

// Admin and SuperAdmin routes
router.post('/', requireSignin, adminMiddleware, createAdminQuery);
router.get('/my', requireSignin, adminMiddleware, getMyAdminQueries);
router.get('/:queryId', requireSignin, adminMiddleware, getAdminQuery);
router.post('/:queryId/messages', requireSignin, adminMiddleware, addMessage);
router.post('/:queryId/messages/:messageId/read', requireSignin, adminMiddleware, markMessageRead);

// SuperAdmin only routes
router.get('/system/all', requireSignin, superAdminMiddleware, getAllAdminQueries);
router.delete('/:queryId', requireSignin, superAdminMiddleware, deleteAdminQuery);

module.exports = router;
