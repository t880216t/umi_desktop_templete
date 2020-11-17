const adb = require("adbkit")
const aport = require('aport')
const {serial} = require('./device')

const client = adb.createClient()

const devicesList = {}

const device_watch = (sender) => {
  client.trackDevices()
    .then((tracker) => {
      tracker.on('add', async (device) => {
        console.log('Device %s was plugged in', device.id)
      })
      tracker.on('change', async (device) => {
        console.log('Device %s was changed', device.id)
        if (device.type === 'device'){
          serial(device)
        }
      })
      tracker.on('remove', (device) => {
        console.log('Device %s was unplugged', device.id)
      })
      tracker.on('end', () => {
        console.log('Tracking stopped')
      })
    })
    .catch(function (err) {
      console.log('Something went wrong:', err.stack)
    })
}
module.exports={
  device_watch,
}
