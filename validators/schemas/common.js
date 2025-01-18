const { z } = require('zod');

// Reusable primitives with common validation rules
const email = z.string()
    .email()
    .max(254)  // Max email length per RFC 5321
    .transform(e => e.toLowerCase());

const password = z.string()
    .min(6)
    .max(72);  // bcrypt's max length

const phone = z.string()
    .max(20)
    .optional();

const name = z.string()
    .max(100)
    .optional();

// Common object schemas that might be reused
const timestamps = z.object({
    createdAt: z.date(),
    updatedAt: z.date()
});

module.exports = {
    email,
    name,
    password,
    phone,
    timestamps
};
