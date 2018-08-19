const EventEmitter = require('events')

function delta (ts) {
  return Date.now() - ts
}

function now () {
  return Date.now()
}

const EXIT_CODES = {
  NORMAL: 0,
  UNCAUGHT_FATAL: 1,
  FATAL: 5
}

class ExitGracefullyError extends Error {}

class ExitGracefully extends EventEmitter {
  constructor () {
    super()
    this._options = {
      timeout: 5000,
      logger: console,
      process: process
    }
    this._connectedSignals = new Set()
    this._connectUnhandled = new Set()
    this.on('trigger_exit', code => {
      this.__triggerExit(null, code)
    })
    this.on('trigger_error', err => {
      this.__triggerExit(err)
    })
  }
  configure (options) {
    this._options = Object.assign(this._options, options)
    return this
  }
  connectCommonSignals () {
    return this.connectSignal(['SIGTERM', 'SIGINT'])
  }
  connectCommonUnhandled () {
    return this.connectUnhandled(['uncaughtException', 'unhandledRejection'])
  }
  connectSignal (signal, code = EXIT_CODES.NORMAL) {
    if (Array.isArray(signal)) {
      signal.forEach(_name => this.connectSignal(_name, code))
      return this
    }
    if (this._connectedSignals.has(signal)) throw new ExitGracefullyError(`Can not connect the same signal twice: ${signal}`)
    this._connectedSignals.add(signal)
    this._options.process.on(signal, () => this.__triggerExit(null, code))
    return this
  }
  connectUnhandled (name, code = EXIT_CODES.UNCAUGHT_FATAL) {
    if (Array.isArray(name)) {
      name.forEach(_name => this.connectUnhandled(_name, code))
      return this
    }
    if (this._connectUnhandled.has(name)) throw new ExitGracefullyError(`Can not connect the same unhndled twice: ${name}`)
    this._connectUnhandled.add(name)
    this._options.process.on(name, err => this.__triggerExit(err, code))
    return this
  }
  __triggerExit (err, code = EXIT_CODES.NORMAL) {
    this._exitRequestAt = now()
    this._exitListeners = this.listenerCount('exit')
    this._exitListenersPending = this._exitListeners

    if (err && this._options.logger) this._options.logger.error(err)
    if (this._options.logger) this._options.logger.debug('ExitGracefully::__triggerExit', `pending:${this._exitListenersPending} listeners:${this._exitListeners}`)

    // nothing to do
    if (this._exitListenersPending === 0) this.__exit(code, true)

    this.__timeout = setTimeout(() => {
      if (this._exitListenersPending === 0) return this.__exit(code, true)
      this.__exit(code, false)
    }, this._options.timeout)

    this.emit('exit', (err) => {
      if (err) {
        this.emit('error', err)
        if (this._options.logger) this._options.logger.error(err)
      }
      --this._exitListenersPending
      if (this._exitListenersPending === 0) this.__exit(code, true)
    })
  }
  __exit (code, successfully = false) {
    if (this.__timeout) clearTimeout(this.__timeout)
    if (successfully) {
      if (this._options.logger) this._options.logger.debug('ExitGracefully::__exit', `gracefully after ${delta(this._exitRequestAt)}`)
    } else {
      if (this._options.logger) this._options.logger.warn('ExitGracefully::__exit', `timeout after ${delta(this._exitRequestAt)}, forcing exit`)
    }
    this.emit('finished')
    this._options.process.nextTick(() => this._options.process.exit(code))
  }
}

module.exports = new ExitGracefully()
module.exports.EXIT_CODES = EXIT_CODES
module.exports.instance = function () {
  return new ExitGracefully()
}
