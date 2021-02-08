const mongoose = require('mongoose');
const configDefault = require('config');
const async = require('async');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')
const ms = require('ms');

const Config = new mongoose.Schema({

}, {id: false, versionKey: false, strict: false});


Config.statics.get = function (type, region, cb) {
  let config;
  const getConfigExactRegion = (next) => {
    if(!region) {
      return next();
    }

    let func = this.findOne({type, 'region.allow': region}, 'config').lean()

    if (configDefault.environment === 'production') {
      func = func.cache(ms('5m')/1000, `config:${type}:${region}`)
    }

    func
      .exec((err, result) => {
        if(err) {
          return next(err);
        }

        config = result;

        next();
      })
  }

  const getDefaultConfig = (next) => {
    if(config) {
      return next();
    }

    const query = {
      type,
      'region.allow': 'all'
    }

    if(region) {
      query['region.deny'] = {
        $ne: region
      }
    }

    let func = this.findOne(query, 'config').lean()

    if (configDefault.environment === 'production') {
      func = func.cache(ms('5m')/1000, `config:${type}:all:except:${region ? region : ''}`)
    }

    func
      .exec((err, result) => {
        if(err) {
          return next(err);
        }

        config = result;

        next();
      })
  }

  async.waterfall([
    getConfigExactRegion,
    getDefaultConfig
  ], (err) => {
    if(err) {
      return cb(err);
    }

    cb(null, config);
  })
}

module.exports = mongoConnections('master').model('Config', Config);
