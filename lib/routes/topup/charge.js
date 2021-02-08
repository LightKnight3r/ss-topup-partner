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
const PushNotifyManager = require('../../job/pushNotify');

module.exports = (req, res) => {

  let id;
  const code = _.get(req, 'body.data.code', '')
  const amount = _.get(req, 'body.data.amount', '')
  const partnerRefId = _.get(req, 'body.data.orderId', '')

  let bonus = 0
  let userInf


  const checkParams = (next) => {
    if(!code) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: MESSAGES.PARTNER.ID_MISSING
      })
    }
    if(!amount) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: MESSAGES.PARTNER.AMOUNT_MISSING
      })
    }
    if(amount < 10000 || amount > 1000000) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: 'Tiền nạp phải trong khoảng giá trị từ 10.000 đ đến 1.000.000 đ'
      })
    }
    if(amount % 1000 !== 0) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: 'Tiền nạp phải là số chia hết cho 1000'
      })
    }

    if(!partnerRefId) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: 'Bạn chưa gửi orderId'
      })
    }
    next();
  }

  const checkPartnerId = (next) => {
    PartnerTopupLog
      .findOne({
        partnerRefId
      })
      .lean()
      .exec((err,result) => {
        if(err) {
          return next(err)
        }
        if(result) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: 'OrderId đã tồn tại, vui lòng kiểm tra lại!'
          })
        }
        next();
      })
  }

  const getMember = (next) => {
    MemberModel
      .findOne({
        code
      })
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err);
        }
        if(!result) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: 'Không tìm thấy thông tin tài xế'
          })
        }
        if(result && result.ship && !result.ship.isAuthen) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: 'Để nạp tiền, Tài xế phải xác thực tại văn phòng HeyU'
          })
        }
        id = result._id
        if(!result.regionTransaction) {
          MemberModel
            .update({
              _id: id
            },{
              regionTransaction: req.partnerInf.region
            },() =>{})
        }

        if(result.regionTransaction && result.regionTransaction !== req.partnerInf.region) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: 'Bạn không thể nạp tiền cho tài xế vì khu vực hoạt động của tài xế không hợp lệ'
          })
        }
        next();
      })
  }

  const getConfigPromote = (next) => {
    ConfigModel
      .get(CONSTANTS.CONFIG_TYPE.PROMOTE_CHARGING, req.partnerInf.region, (err, data) => {
        if(err) {
          return next(err);
        }
        if(!data || !data.config || !data.config.partner) {
          return next()
        }

        bonus = data.config.partner;
        next();
      })
  }

  const increaseCoints = (next) => {
    const moreCoints = Math.floor(amount + amount*bonus/100);

    MemberModel.increaseCoint(id, moreCoints, (err, resultUpdate) => {
      if(err) {
        return next(err)
      }

      userInf = resultUpdate;

      next(null);
    })
  }

  const writeTransactionLog = (next) => {
    next(null);

    if(userInf) {
      const bonusCoints = amount*bonus/100;

      TransactionLog
        .create({
          member: userInf._id,
          data: {
            type: 21,
            gateway: "direct",
            bonus: 0,
            discount: 0,
            amount: amount,
            initialCoints: userInf.coints - amount - bonusCoints,
            finalCoints: userInf.coints - bonusCoints,
            initialRealMoney: userInf.realMoney,
            finalRealMoney: userInf.realMoney,
            idTransaction: partnerRefId
          },
          region: userInf.regionTransaction || req.partnerInf.region,
          message: `Nạp trực tiếp từ ${req.partnerInf.name}`
        }, () => {
          if(bonus) {
            TransactionLog
              .create({
                member: userInf._id,
                data: {
                  type: 8,
                  gateway: "bank",
                  amount: bonusCoints,
                  initialCoints: userInf.coints - bonusCoints,
                  finalCoints: userInf.coints,
                  initialRealMoney: userInf.realMoney,
                  finalRealMoney: userInf.realMoney,
                  idTransaction: partnerRefId
                },
                region: userInf.regionTransaction || req.partnerInf.region,
                message: `Khuyến mại tài xế nạp Coints qua Văn phòng đối tác`
              }, () => {
              })
          }
        })
    }
  }

  const writeTopupLog = (next) => {

    PartnerTopupLog
      .create({
        member : id,
        code,
        amount,
        request:req.body,
        partnerRefId,
        partner: req.partnerInf._id,
        region: req.partnerInf.region
      },(err,result) => {
        if(err) {
          return next(err);
        }
        PushNotifyManager
          .sendToMember(
            id,
            "Nạp tiền thành công",
            `Bạn vừa nạp ${amount} vào tài khoản Coints. Số dư của bạn hiện tại là ${userInf.coints}`,
            {link: "ProfileScreen"},
            "profile_update"
          )
        if(bonus) {
          PushNotifyManager
            .sendToMember(
              id,
              "Xin chúc mừng",
              `Bạn vừa được khuyến mại ${bonus}% giá trị nạp qua văn phòng đối tác`,
              {link: "ProfileScreen"},
              "profile_update"
            )
        }
        next(null,{
          code: CONSTANTS.CODE.SUCCESS,
          data: {
            transactionId: result._id,
            member: {
              name: userInf.name,
              code: code
            },
            amount,
            orderId: partnerRefId
          }
        })
      })
  }

  async.waterfall([
    checkParams,
    checkPartnerId,
    getMember,
    getConfigPromote,
    increaseCoints,
    writeTransactionLog,
    writeTopupLog
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
