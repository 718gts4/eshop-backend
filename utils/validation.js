const mongoose = require('mongoose');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const hasSuperAdminRole = user => user?.role === 'superAdmin';
const hasAdminRole = user => user?.role === 'admin' && user?.isAdmin === true;
const hasAdminLevel = user => hasAdminRole(user) || hasSuperAdminRole(user);

module.exports = {
    isValidId,
    hasSuperAdminRole,
    hasAdminRole,
    hasAdminLevel,
};
