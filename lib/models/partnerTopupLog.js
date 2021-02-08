const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const PartnerTopUpLogSchema = new mongoose.Schema({
    member : {type: mongoose.Schema.Types.ObjectId, ref: 'Member'},
    amount: {type: Number},
    createdAt: {
        type: Number,
        default: Date.now
    },
    request:{
      type: mongoose.Schema.Types.Mixed
    },
    partnerRefId: {
      type: String
    },
    code: {
      type: String
    },
    partner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner'
    },
    region: {type: String}
}, {id: false, versionKey: false, strict: false});

module.exports = mongoConnections('master').model('PartnerTopupLog', PartnerTopUpLogSchema);
