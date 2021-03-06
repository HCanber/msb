'use strict';
/* Setup */
/*jshint camelcase: false */
var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;
var expect = Code.expect;

/* Modules */
var simple = require('simple-mock');
var msb = require('..');
var Requester = msb.Requester;

/* Tests */
describe('Requester', function() {

  afterEach(function(done) {
    simple.restore();
    done();
  });

  it('can be initialized', function(done) {
    simple.mock(msb.messageFactory, 'createRequestMessage');
    simple.mock(Requester, 'super_');

    var obj = Requester({}); // jshint ignore:line

    expect(msb.messageFactory.createRequestMessage.called).to.equal(true);
    expect(Requester.super_.called).to.equal(true);
    done();
  });

  describe('publish()', function() {
    var producer;

    beforeEach(function(done) {
      producer = {};

      simple.mock(producer, 'publish');
      simple.mock(msb.channelManager, 'findOrCreateProducer', function(topic) {
        return producer;
      });

      done();
    });

    it('can emit error', function(done) {
      var errHandler = simple.mock();
      var expectedErr = new Error();
      producer.publish.callbackWith(expectedErr);

      var obj = new Requester({
        waitForResponses: 0
      });

      obj
      .on('error', errHandler)
      .publish();

      expect(producer.publish.called).to.equal(true);
      expect(errHandler.called).to.equal(true);
      expect(errHandler.lastCall.args[0]).to.equal(expectedErr);

      done();
    });

    it('can emit message immediately', function(done) {
      producer.publish.callbackWith();

      var endHandler = simple.mock();

      var obj = new Requester({
        waitForResponses: 0
      });

      obj
      .on('end', endHandler)
      .publish();

      expect(producer.publish.called).to.equal(true);
      expect(endHandler.called).to.equal(true);

      done();
    });

    it('can start collecting responses', function(done) {
      producer.publish.callbackWith();

      var endHandler = simple.mock();

      var obj = new Requester({
        waitForResponses: 1
      });

      var bindMock = simple.mock(obj.shouldAcceptMessageFn, 'bind').returnWith('testValue');
      simple.mock(obj, 'listenForResponses').returnWith();

      obj
      .on('end', endHandler)
      .publish();

      expect(bindMock.lastCall.args[0]).to.equal(obj);
      expect(obj.listenForResponses.lastCall.args[0]).to.equal(obj.message.topics.response);
      expect(obj.listenForResponses.lastCall.args[1]).to.equal('testValue');
      expect(producer.publish.called).to.equal(true);
      expect(endHandler.called).to.equal(false);

      done();
    });

    it('can wait for acks without any determined number of responses', function(done) {
      producer.publish.callbackWith();

      var endHandler = simple.mock();

      var obj = new Requester({
        waitForResponses: 0,
        waitForAcksMs: 800
      });

      var bindMock = simple.mock(obj.shouldAcceptMessageFn, 'bind').returnWith('testValue');
      simple.mock(obj, 'listenForResponses').returnWith();
      simple.mock(obj, 'isAwaitingAcks').returnWith(true);

      obj
      .on('end', endHandler)
      .publish();

      expect(bindMock.lastCall.args[0]).to.equal(obj);
      expect(obj.listenForResponses.lastCall.args[0]).to.equal(obj.message.topics.response);
      expect(obj.listenForResponses.lastCall.args[1]).to.equal('testValue');
      expect(producer.publish.called).to.equal(true);
      expect(endHandler.called).to.equal(false);

      done();
    });
  });

  describe('shouldAcceptMessageFn()', function(done) {

    it('should per default match on message id', function(done) {
      var obj = new Requester({});

      expect(obj.shouldAcceptMessageFn({
        correlationId: 'other'
      })).false();

      expect(obj.shouldAcceptMessageFn({
        correlationId: obj.message.correlationId
      })).true();

      done();
    });

  });
});
