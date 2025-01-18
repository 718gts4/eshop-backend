const mongoose = require('mongoose');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isSuperAdmin = user => user?.role === 'superAdmin';
const isAdmin = user => user?.role === 'admin';
const isAdminOrSuperAdmin = user => isAdmin(user) || isSuperAdmin(user);

module.exports = {
    isValidId,
    isSuperAdmin,
    isAdmin,
    isAdminOrSuperAdmin,
};
