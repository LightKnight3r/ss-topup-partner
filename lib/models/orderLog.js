const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const OrderLog = new mongoose.Schema({
  member: {
    type: Schema.Types.ObjectId
  },
  order: {
    type: Schema.Types.ObjectId
  },
  shop: {
    type: Schema.Types.ObjectId
  },
  shipper: {
    type: Schema.Types.ObjectId
  },
  type: {
    type: String
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

module.exports = mongoConnections('master').model('OrderLog', OrderLog);
