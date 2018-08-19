/* eslint-env node, mocha */

const { assert } = require('chai')
const exitGracefully = require('../index.js')

describe('#exitGracefully.add()', function () {
  const instance = exitGracefully.instance()
  instance.configure({
    process: {
      exit: () => {}
    }
  })

  it('should be called on exit', function (done) {
    instance.on('exit', (doneCall) => {
      done()
      doneCall()
    })
    instance.__triggerExit()
  })
})

describe('#exitGracefully.remove()', function () {
  const instance = exitGracefully.instance()
  function onExit () {
    console.log('called?')
  }
  instance.on('exit', onExit)
  instance.off('exit', onExit)
  it('should be have no listeners', function () {
    assert.equal(instance.listenerCount('exit'), 0)
  })
})
