# redis-setinterval

setInterval for scalable applications. Use in case you want to execute a job on the tick of a clock across distributed workers. The job is only executed once each tick no matter how many instances. It uses a Redis locking mechanism and stores the interval time in Redis as well. That way interval time can be dynamically adjusted.


## API

### `.start(id, [options], func)`

Start the interval on `id`, executing `func` every time the interval fires, `func` is executed each tick. Keep in mind that it is not guaranteed the function will run ever, if the same id is used to register an interval timer, only one of them will run.

* `id`: the unique identifier used to register the interval timer.
* `options`: optional options object
  * `initialInterval`: the interval time (ms) used when the timer was never initialized before. default: `10000`.
  * `pollTime`: The interval time used to poll Redis to acquire the lock. Default: `100`
  * `redis`: either an existing redisclient or an object containing:
    * `port`: port of the Redis. Default: `6379`.
    * `host`: Host on which redis runs. Default: `localhost`
    * `options`: additional Redis options (see [createClient](https://github.com/mranney/node_redis#rediscreateclient))
  * `prefix`: optional prefix to be used to scope the lock.
* `func`: function that has to be executed on the tick of the interval.

This function returns an instance of `RedisInterval`.

### `RedisInterval`

#### `setInterval(interval)`

Changes the interval time. This is stored in Redis. Only has to be executed in one instance to change it for all of them.

* `interval`: the new required interval time.

#### `reset()`

Reset the current lock so it can be acquired immediately again and `func` will be executed immediately. Again, there is no guarantee the function will execute in the same worker that initiated the reset command

#### `cancel()`

Cancels the interval.
