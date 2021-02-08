const async = require('async');
const _ = require('lodash');
const Joi = require('joi');
const PartnerModel = require('../models/partner');
const CONSTANTS = require('../const')
const MESSAGES = require('../message')

module.exports = (req, res, next) => {
  const apiKey = req.body.apiKey || '';

  const checkParams = (done) => {

    if(!apiKey) {
      return done({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: MESSAGES.PARTNER.API_KEY
      })
    }

    done(null);
  }

  const getPartnerInf = (done) => {
    PartnerModel
      .findOne({
        apiKey: apiKey,
        status: 1
      })
      .lean()
      .exec((err, result) => {
        if(err) {
          return done(err);
        }

        if(!result) {
          return done({
            code: CONSTANTS.CODE.FAIL,
            message: MESSAGES.PARTNER.NOT_EXISTS_OR_NOT_ACTIVE
          })
        }

        req.partnerInf = result;
        done(null);
      })
  }

  async.waterfall([
    checkParams,
    getPartnerInf
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    if(err || data) {
      return res.json(err || data);
    }

    next();
  })
}
