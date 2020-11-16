var adb = require("adbkit")
var client = adb.createClient()

exports.onDevices = function(){
  client.trackDevices()
    .then(function (tracker) {
      tracker.on('add', function (device) {
        console.log('Device %s was plugged in', device.id)
      })
      tracker.on('remove', function (device) {
        console.log('Device %s was unplugged', device.id)
      })
      tracker.on('end', function () {
        console.log('Tracking stopped')
      })
    })
    .catch(function (err) {
      console.log('Something went wrong:', err.stack)
    })
}
