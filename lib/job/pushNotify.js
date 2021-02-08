const async = require('async');
const MembersModel = require('../models/members')
const NotifyModel = require('../models/notify')
const IOSHandle = require('../push/ios')
const AndroidHandle = require('../push/android')
const SocketManager = require('../socket')
const config = require('config')
const rp = require('request-promise')
const CONSTANTS = require('../const')

class NotifyManager {
  sendToMember(id, title, description, data, eventName) {
    return new Promise((resolve, reject) => {
      if(SocketManager.isConnect(id) && eventName) {
        SocketManager.sendToMember(id, eventName, {title: title, description:description, data: data, icon: 'http://is3.mzstatic.com/image/thumb/Purple122/v4/69/a6/c1/69a6c183-8afc-bbb9-0aeb-70168e51400b/source/175x175bb.jpg'});
      } else {
        const options = {
          method: 'POST',
          uri: `${config.proxyRequestServer.pushNotify}/api/v1.0/push-notification/member`,
          body: {
              userId: id,
              title: title,
              message: description,
              data: data
          },
          json: true // Automatically stringifies the body to JSON
        };

        rp(options)
          .then((result) => {
            if(result.code === 501) {
              return reject(new Error(`Not found token inf`))
            }

            if((result.code === CONSTANTS.CODE.FAIL) || (result.code === CONSTANTS.CODE.SYSTEM_ERROR)) {
              return reject(new Error(`Push fail`))
            }

            resolve(result)
          })
          .catch((err) => {
            reject(err)
          });
      }
    });
  }

  sendAllToHCM(title, description, data) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        uri: `${config.proxyRequestServer.pushNotify}/api/v1.0/push-notification/all`,
        body: {
            query: {
              type: 0,
              region: 'hcm'
            },
            title: title,
            message: description,
            data: data
        },
        json: true // Automatically stringifies the body to JSON
      };

      rp(options)
        .then((result) => {
          if(result.code === 500) {
            return reject(new Error(`System error`))
          }

          resolve(result)
        })
        .catch((err) => {
          reject(err)
        });
    });
  }

  sendViaSocket(id, eventName, data) {
    if(SocketManager.isConnect(id)) {
      SocketManager.sendToMember(id, eventName, data);
    }
  }
}
module.exports = new NotifyManager
