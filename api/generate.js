const aiHandler = require('./ai');

module.exports = async function handler(req, res) {
    return aiHandler(req, res);
};
