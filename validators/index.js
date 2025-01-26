// Export all schema through a single entry point
module.exports = {
    ...require('./schemas/auth'),
    ...require('./schemas/superadmin-question'),
    ...require('./schemas/common')
};
