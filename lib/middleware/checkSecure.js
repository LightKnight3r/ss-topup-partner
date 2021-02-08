const crypto = require('crypto');
const async = require('async');
const CONSTANTS = require('../const')
const MESSAGES = require('../message')
const _ = require('lodash')
module.exports = (req, res, next) => {

  const checkSum = req.body.checksum;
  const checkParams = (done) => {
    if(!checkSum) {
      return done({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: MESSAGES.PARTNER.CHECKSUM_MISSING
      })
    }

    if(!req.body.data) {
      return done({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: MESSAGES.PARTNER.DATA_MISSING
      })
    }

    done();
  }
  const validateCheckSum = (done) => {

    const secret = req.partnerInf.secret;
    const data = req.body.data
    const codeForEncrypt = `${JSON.stringify(data)}+${secret}`
    const checksumMd5 = crypto.createHash('md5').update(codeForEncrypt).digest("hex");
    console.log('ahihi',checksumMd5);
    if(checksumMd5.toLowerCase() !== checkSum.toLowerCase()) {
      return done({
        code: CONSTANTS.CODE.FAIL,
        message: MESSAGES.PARTNER.WRONG_CHECKSUM
      })
    }
    done();
  }
  async.waterfall([
    checkParams,
    validateCheckSum
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
