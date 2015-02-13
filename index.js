'use strict';
/*
  e.g. `require('msb').channelManager` or `require('msb/lib/channelManager')`
*/
var msb = exports;
msb.channelManager = require('./lib/channelManager');
msb.channelMonitor = require('./lib/channelMonitor');
msb.messageFactory = require('./lib/messageFactory');
msb.Collector = require('./lib/collector');
msb.Originator = require('./lib/originator');
msb.Contributor = require('./lib/contributor');
msb.serviceDetails = require('./lib/support/serviceDetails');
msb.configure = require('lodash').merge.bind(null, require('./lib/config'));