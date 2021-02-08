const rp = require('request-promise');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const MemberModel = require('../../models/member')
const config = require('config')
const requestUtil = require('../../utils/request');
const _ = require('lodash')
const async = require('async')

module.exports = (req, res) => {

  const code = _.get(req, 'body.data.code', '')

  const checkParams = (next) => {
    if(!code || (code && !code.trim())) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: MESSAGES.PARTNER.CODE_NOT_FOUND
      })
    }
    next();
  }

  const findByCode = (next) => {
    MemberModel
      .findOne({
        code
      })
      .select('facebook.name code coints ship')
      .lean()
      .exec((err, result) => {

        if(err) {
          return next(err);
        }
        if(!result) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: MESSAGES.PARTNER.NOT_FOUND
          })
        }
        if(result && result.ship && !result.ship.isAuthen) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: 'Tài khoản chưa được HeyU xác thực nên chưa nạp được tiền'
          })
        }
        result.name = result.facebook.name
        result.money = result.coints
        delete result.facebook
        delete result.ship
        delete result._id
        delete result.coints
        next(null,{
          code: CONSTANTS.CODE.SUCCESS,
          data: result
        });
      })
  }

  async.waterfall([
    checkParams,
    findByCode
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
