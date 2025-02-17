const { z } = require('zod');
const { email, password, phone, name } = require('./common');

// Base auth schema used for login
const authSchema = z.object({
    email,
    password
});

// Extended schema for registration with additional fields
const registerSchema = authSchema.extend({
    name,
    phone
});

module.exports = {
    authSchema,
    registerSchema
};
