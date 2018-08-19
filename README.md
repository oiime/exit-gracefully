## about

`exit-gracefully` is a zero dependency module that helps with exiting gracefully from a nodejs process, it's an event listener that allows for subscribing exit events that'll need to be complete before `process.exit()` is called

## installation
```bash
npm install --save exit-gracefully
```

## by example

`exit-gracefully` has a pretty short simple code, the easiest way would be to just read through it

#### simplest use
```javascript
const exitGracefully = require('exit-gracefully')

// this only needs to be done once in your codebase, this connects to process events, can provided as an array or single strings
// if you dont attach any event exitGracefully wouldnt be of much use
exitGracefully.connectCommonSignals().connectCommonUnhandled()

exitGracefully.on('exit', (done) => {
  // do some stuff then:
  done() // im finished now, can exit
})
```


#### more complex use cases
```javascript
const exitGracefully = require('exit-gracefully')

exitGracefully.configure({
  timeout: 5000, // alternative maximum time in ms until forced exit occures, default is 5 seconds
  logger: someLogger, // some standard logger that follows the (.debug(), .error()), if set to null errors would be swallowed
  process: process // use a different process, no idea why you'd want to do that
})

// connect specific signals only
exitGracefully.connectSignal(['SIGTERM', 'SIGINT'])
exitGracefully.connectUnhandled(['uncaughtException', 'unhandledRejection'])

// change exit code for a signal
exitGracefully.connectSignal('SIGTERM', exitGracefully.EXIT_CODES.NORMAL) // EXIT_CODES.NORMAL is the default

// trigger a graceful exit
exitGracefully.emit('trigger_exit', exitGracefully.EXIT_CODES.NORMAL) // EXIT_CODES.NORMAL is the default

// trigger a graceful exit with an error attached
exitGracefully.emit('trigger_error', new Error('some fatal error')) // EXIT_CODES.NORMAL is the default


// if an exit process exists with done(error) you can get it here
exitGracefully.on('error', err => {})

// do some stuff before an exit, you can not do any async stuff here, you only have one tick
exitGracefully.on('finished', () => {
  console.log('goodbye.')
})

function doSomethingImportant () {
  function onExit (done) {
    // hurry up and finish
    done()
  }
  exitGracefully.on('exit', onExit)

  // do normal stuff
  // done normally, we wouldnt need the exit anymore
  exitGracefully.off('exit', onExit)
}

doSomethingImportant()

```

License: MIT
