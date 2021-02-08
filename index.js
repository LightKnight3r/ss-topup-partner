const _ = require('lodash')
const config = require('config')
const express = require('express')
const Logger = require('./lib/logger')
var morgan = require('morgan')

// Global variables
global.logger = Logger(`${__dirname}/logs`);

// Middleware
const bodyParser = require('body-parser')

// Handle routes
const TopupHandle = require('./lib/routes/topup')

// Start server, socket
const app = express();
const server = require('http').Server(app);

app.use(bodyParser.json());
app.use(morgan('combined'))
app.use(require('./lib/middleware/getPartnerInf'));
app.use(require('./lib/middleware/checkSecure'));
// This is for test purpose

app.post('/api/v1.0/topup/find-user-by-code', TopupHandle.findUserByCode)
app.post('/api/v1.0/topup/charge', TopupHandle.charge)
app.post('/api/v1.0/topup/list-transaction', TopupHandle.list)

const port = _.get(config, 'port', 3000);
server.listen(port, () => {
  logger.logInfo('Server listening at port:', port)
});

process.on('uncaughtException', (err) => {
  logger.logError('uncaughtException', err)
});
