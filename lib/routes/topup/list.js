const rp = require('request-promise');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const MemberModel = require('../../models/member')
const ConfigModel = require('../../models/config')
const PartnerTopupLog = require('../../models/partnerTopupLog')
const TransactionLog = require('../../models/transactionLog')
const config = require('config')
const requestUtil = require('../../utils/request');
const _ = require('lodash')
const async = require('async')

module.exports = (req, res) => {

  const limit = _.get(req, 'body.data.limit', 15);
  const page = _.get(req, 'body.data.page', 0);
  const sort = _.get(req, 'body.data.sort', 1);
  const partner = req.partnerInf._id

  const listHistory = (next) => {

    if(limit > 60) {
      limit = 60
    }
    const skip = page*limit;
    const options = {
      limit,
      skip,
      sort: sort == 1 ? 'createdAt' : '-createdAt'
    }
    let obj = {
      partner
    }

    PartnerTopupLog
      .find(obj, "member partnerRefId createdAt amount",options)
      .populate('member','facebook.name code')
      .lean()
      .exec((err,results) => {
        if(err) {
          return next(err)
        }
        results.forEach((item, i) => {
          item.member = {
            name: item.member && item.member.facebook && item.member.facebook.name || '',
            code: item.member && item.member.code || ''
          }
          item.orderId = item.partnerRefId || '';
          item.transactionId = item._id
          delete item._id
          delete item.partnerRefId
        });

        next(null,{
          code: CONSTANTS.CODE.SUCCESS,
          data: results
        })
      })
  }

  async.waterfall([
    listHistory
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
