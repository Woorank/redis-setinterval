'use strict';

var redis = require('redis');

function RedisInterval(id, options, func) {
  if (!func) {
    func = options;
    options = {};
  }

  this.func = func;
  options = options || {};

  if (options.redis instanceof redis.RedisClient) {
    this.client = options.redis;
  } else if (options.redis) {
    this.client = redis.createClient(
      options.redis.port, options.redis.host, options.redis.options);
  } else {
    this.client = redis.createClient();
  }

  var initialInterval = options.initialInterval || 10000;
  var pollTime = options.pollTime || 100;

  var prefix = options.prefix ? (options.prefix + ':') : '';
  this._lockKey = prefix + id + ':lock';
  this._timeKey = prefix + id + ':time';

  this.pollTimer = null;
  this._startPolling(pollTime, initialInterval);
}

RedisInterval.prototype._startPolling = function (pollTime, initialInterval) {
  var lockScript = [
    'local interval = redis.call("GET", KEYS[2])',
    'if not interval then',
    '  interval = ARGV[1]',
    '  redis.call("SET", KEYS[2], interval)',
    'end',
    'return redis.call("SET", KEYS[1], 1, "PX", interval, "NX")'
  ].join('\n');

  this.pollTimer = setInterval(function () {
    this.client.eval(
      lockScript, 2, this._lockKey, this._timeKey, initialInterval,
        function (err, result) {
        if (err || !result) {
          return;
        }
        this.func.apply();
      }.bind(this)
    );
  }.bind(this), pollTime);
};

RedisInterval.prototype.setInterval = function (interval, callback) {
  this.client.multi()
    .pexpire(this._lockKey, interval)
    .set(this._timeKey, interval)
    .exec(function (err) {
      if (typeof callback === 'function') {
        callback(err);
      }
    });
};

RedisInterval.prototype.reset = function (callback) {
  this.client.del(this._lockKey, callback);
};

RedisInterval.prototype.cancel = function () {
  if (this.pollTimer) {
    clearInterval(this.pollTimer);
    this.pollTimer = null;
  }
};

function start(key, options, func) {
  return new RedisInterval(key, options, func);
}

exports.start = start;
