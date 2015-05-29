var fs = require('fs')

// Read current temperature from sensor
var readTemp = function(file, callback){
  fs.readFile(file, function(err, buffer) {

    if (err) {
      return callback(err)
    }

    // Read data from file (using fast node ASCII encoding).
    var str = buffer.toString('ascii')

    var data = str.split(' ') // Split by space

    var isAvailable = 0 === data[11].indexOf('YES\n')
    if (!isAvailable) {
      callback(new Error('The sensor is not available. Raw data: '+data))
    }

    // Extract temperature from string and divide by 1000 to give celsius
    var temperature = parseFloat(data[data.length-1].split('=')[1])
    var celsius  = temperature/1000.0

    // Execute call back with data
    callback(null, {celsius: celsius, temperature: temperature, raw: str})
  })
}

var readTempPromised = function(file) {
   return new Promise(function(resolve, reject) {
      readTemp(file, function(err, data) {
         if (err) {
            reject(err)
         }
         else {
            resolve(data)
         }
      })
   })
}


var timeoutPromise = function(timeout, stopTimeout) {
   if (!stopTimeout) {
      stopTimeout = {}
   }
   return new Promise(function(resolve) {
      stopTimeout.stop = function() {
         clearTimeout(stopTimeout.timer)
      }
      stopTimeout.timer = setTimeout(resolve, timeout)
   })
}

var stopPromise = function(resolvePromise) {
   var defer = {}
   var promise = new Promise(function(resolve, reject) {
      defer.reject = reject
      resolvePromise.then(resolve, reject)
   })
   promise.stop = defer.reject
   return promise
}

var worker = function(file, timeout, dataCb) {
   var enabled = true
   var promise
   var stopTimeout = {}

   var start = function() {
      var startTime = (new Date).getTime()
      promise = stopPromise(readTempPromised(file))
      promise.then(function(data) {
         if (enabled) return dataCb(null, data)
      })
      .catch(function(err) {
         if (enabled) return dataCb(err)
      })
      .then(function() {
         var timeDelta = (new Date).getTime() - startTime
         var sleepTime = Math.max(0, timeout - timeDelta)
         if (enabled) return timeoutPromise(sleepTime, stopTimeout)
      })
      .then(function() {
         if (enabled) start()
      })
   }

   var stop = function() {
      enabled = false
      promise.stop()
      if (stopTimeout.stop) {
         stopTimeout.stop()
      }
   }

   start()

   return stop
}

exports.worker = worker
exports.readTempPromised = readTempPromised
exports.readTemp = readTemp
