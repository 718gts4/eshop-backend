const ko = require('./ko');
const en = require('./en');

// Use English messages in development, Korean in production
const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = isDevelopment ? en : ko;