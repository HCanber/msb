'use strict';
// $lab:coverage:off$
var EventEmitter = require('events').EventEmitter;
var redis = require('redis');
var debug = require('debug')('msb:broker');
var queue = exports;

queue.create = function() {
  var queue = {};
  var publisherClient;
  var subscriberClient;

  queue.Publish = function(config) {
    publisherClient = publisherClient || redis.createClient(config.port, config.host, config.options);
    publisherClient.on('error', debug);

    return {
      channel: function(channel) {
        return {
          publish: function(message, cb) {
            publisherClient.publish(channel, JSON.stringify(message), cb);
          },
          close: _noop
        };
      }
    };
  };

  queue.Subscribe = function(config) {
    subscriberClient = subscriberClient || redis.createClient(config.port, config.host, config.options);
    subscriberClient.setMaxListeners(0);

    var emitter = new EventEmitter();

    function onClientMessage(channel, message) {
      if (channel !== config.channel) return;
      process.nextTick(function() {
        var parsedMessage;
        try {
          parsedMessage = JSON.parse(message);
        } catch (e) {
          emitter.emit('error', e);
          return;
        }
        emitter.emit('message', parsedMessage);
      });
    }

    subscriberClient.on('message', onClientMessage);
    subscriberClient.on('error', debug);
    subscriberClient.on('error', emitter.emit.bind(emitter, 'error'));
    subscriberClient.on('end', emitter.emit.bind(emitter, 'end'));

    emitter.close = function() {
      subscriberClient.removeListener('message', onClientMessage);
      subscriberClient.unsubscribe(config.channel);
    };

    subscriberClient.subscribe(config.channel);

    return emitter;
  };

  return queue;
};

function _noop() {}
// $lab:coverage:on$
