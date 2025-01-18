// Export all schemas through a single entry point
module.exports = {
    ...require('./schemas/auth'),
    ...require('./schemas/admin-query'),
    ...require('./schemas/common')
};
