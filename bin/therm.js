#!/usr/bin/env node

var therm = require('.')
var TIMEOUT = Number(process.argv.pop())
var FILE = process.argv.pop()
var stop = therm.worker(FILE, TIMEOUT, function(err, data) {
   if (err) {
      console.error(err)
      console.error(err.stack)
   }
   else {
      console.log(data.temp)
   }
})
