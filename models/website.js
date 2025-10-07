const mongoose = require('mongoose');

const WebsiteSchema = new mongoose.Schema({
    websiteName: {
        type: String,
        unique: true
    },
    domain:{
        type: String
    }
}, {timestamps: true});

const Website = mongoose.model('Website', WebsiteSchema);
module.exports = Website;
