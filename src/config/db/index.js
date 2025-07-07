const mongoose = require('mongoose');
const env = require('../env');
const { logger } = require('../logger');

async function connect() {
    try {
        await mongoose.connect(env.db.uri);
        logger.log('Connect successfully!!!');
    } catch (error) {
        logger.log('connect failure!!!');
    }
}
module.exports = { connect };