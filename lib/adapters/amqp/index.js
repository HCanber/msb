var _ = require('lodash');
var AMQPPublisherAdapter = require('./publisher').AMQPPublisherAdapter;
var AMQPSubscriberAdapter = require('./subscriber').AMQPSubscriberAdapter;
var AMQP = require('amqp-coffee');

var amqp = exports;

amqp.create = function() {
  var amqp = {};
  var connection;

  amqp.Publish = function(config) {
    var publisher = new AMQPPublisherAdapter(config, sharedConnection(config));

    return {
      channel: function(topic) {
        return {
          publish: publisher.publish.bind(publisher, topic),
          close: publisher.close.bind(publisher)
        };
      }
    };
  };

  amqp.Subscribe = function(config) {
    return new AMQPSubscriberAdapter(config, sharedConnection(config));
  };

  amqp.close = function() {
    if (!connection) return;
    connection.close();
  };

  function sharedConnection(config) {
    if (connection) return connection;

    connection = new AMQP(_.clone(config));
    connection.setMaxListeners(0);
    return connection;
  }

  return amqp;
};
