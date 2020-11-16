var adb = require("adbkit")
const client = adb.createClient()

exports.onDevices = function(sender){
  client.trackDevices()
    .then(function (tracker) {
      tracker.on('add', function (device) {
        console.log('Device %s was plugged in', device.id)
        client.listDevices().then(function (devices) {
          sender.send('fromMain', devices)
        })
      })
      tracker.on('remove', function (device) {
        console.log('Device %s was unplugged', device.id)
        client.listDevices().then(function (devices) {
          sender.send('fromMain', devices)
        })
      })
      tracker.on('end', function () {
        console.log('Tracking stopped')
      })
    })
    .catch(function (err) {
      console.log('Something went wrong:', err.stack)
    })
}
exports.listDevices = function(sender){
  client.listDevices()
    .then(function (devices) {
      sender.send('fromMain', devices)
    })
    .catch(function (err) {
      console.log('Something went wrong:', err.stack)
    })
}

