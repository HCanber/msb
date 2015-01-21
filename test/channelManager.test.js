/* Setup */
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
var queue = require('message-queue')('redis');
var msb = require('..');
var channelManager = msb.channelManager;

describe('channelManager', function() {
  beforeEach(function(done) {
    simple.mock(channelManager.config, 'host', 'mock.host');
    simple.mock(channelManager.config, 'port', '99999');
    done();
  });

  afterEach(function(done) {
    simple.restore();
    done();
  });

  describe('findOrCreateProducer', function() {
    beforeEach(function(done) {
      simple.mock(channelManager, 'onNewChannel').returnWith();
      done();
    });

    it('can reuse publisher and channels per topic', function(done) {
      var mockPublisher = {};

      simple.mock(queue, 'Publish').returnWith(mockPublisher);

      simple
      .mock(mockPublisher, 'channel')
      .returnWith(1)
      .returnWith(2)
      .returnWith(null);

      var producer1a = channelManager.findOrCreateProducer('prod1.1');

      expect(mockPublisher.channel.called).true();
      expect(mockPublisher.channel.lastCall.args[0]).equals('prod1.1');

      var producer2 = channelManager.findOrCreateProducer('prod1.2');

      expect(mockPublisher.channel.lastCall.args[0]).equals('prod1.2');
      expect(mockPublisher.channel.called).true();

      var producer1b = channelManager.findOrCreateProducer('prod1.1');

      expect(queue.Publish.callCount).equals(1);
      expect(queue.Publish.lastCall.args[0]).to.deep.include({ host: 'mock.host' });
      expect(mockPublisher.channel.callCount).equals(2);
      expect(producer2).to.not.equal(producer1a);
      expect(producer1a).equals(producer1b);
      done();
    });
  });

  describe('findOrCreateConsumer', function() {
    beforeEach(function(done) {
      simple.mock(channelManager, 'onNewChannel').returnWith();
      done();
    });

    it('can reuse subscribers per topic', function(done) {
      var mockSubscriber1 = {};
      var mockSubscriber2 = {};

      simple.mock(mockSubscriber1, 'setMaxListeners');
      simple.mock(mockSubscriber2, 'setMaxListeners');

      simple
      .mock(queue, 'Subscribe')
      .returnWith(mockSubscriber1)
      .returnWith(mockSubscriber2)
      .returnWith(null);

      var consumer1a = channelManager.findOrCreateConsumer('con1.1');

      expect(queue.Subscribe.called).true();
      expect(queue.Subscribe.lastCall.args[0]).deep.include({
        channel: 'con1.1',
        host: 'mock.host',
        port: '99999'
      });

      var consumer2 = channelManager.findOrCreateConsumer('con1.2');

      expect(queue.Subscribe.lastCall.args[0]).deep.include({
        channel: 'con1.2',
        host: 'mock.host',
        port: '99999'
      });

      var consumer1b = channelManager.findOrCreateConsumer('con1.1');

      expect(queue.Subscribe.callCount).equals(2);
      expect(consumer2).to.not.equal(consumer1a);
      expect(consumer1a).equals(consumer1b);
      expect(mockSubscriber1.setMaxListeners.callCount).equals(1);
      expect(mockSubscriber2.setMaxListeners.callCount).equals(1);
      done();
    });
  });
});
