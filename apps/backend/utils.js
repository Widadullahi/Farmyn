const crypto = require('node:crypto');
const error = (status, message) => Object.assign(new Error(message), { status });
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
module.exports = { error, hash };
