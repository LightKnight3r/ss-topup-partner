const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var PartnerSchema = new mongoose.Schema({
    email : {type: String},
    phone : {type: String},
    name: {type: String},
    address: {type: String},
    website: {type: String},
    description: {type: String},
    location: {type: Schema.Types.Mixed},
    image: {type: Schema.Types.Mixed},
    active: {type: Number, default: 0},
    status: {type: Number, default: 1},
    createdAt: { type: Number, default: Date.now },
    updatedAt: {type: Number, default: Date.now },
    region: {
      type: String,
      default: 'hn'
    }
}, {id: false, versionKey: 'v'})

module.exports = mongoConnections('master').model('Partner', PartnerSchema);
