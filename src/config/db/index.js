const mongoose = require('mongoose');
const env = require('../env');

async function connect() {
    try {
        await mongoose.connect(env.db.uri);
        console.log('Connect successfully!!!');
    } catch (error) {
        console.log('connect failure!!!');
    }
}
module.exports = { connect };