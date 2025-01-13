const mongoose = require('mongoose');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isSuperAdmin = user => user?.role === 'superAdmin';

module.exports = {
    isValidId,
    isSuperAdmin,
};
