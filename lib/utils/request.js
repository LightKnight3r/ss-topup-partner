const rp = require('request-promise')
const CONSTANTS = require('../const')

module.exports = {
  makeRequest: (options) => {
    return new Promise((resolve, reject) => {
      rp(options)
        .then((result) => {
          if(result.message) {
            result.message = result.message.body ? result.message.body : result.message
          }

          if (result.code === CONSTANTS.CODE.SUCCESS) {
            return resolve(result);
          }

          return reject(result);
        })
        .catch((err) => {
          return reject(err);
        })
    })
  }
}
