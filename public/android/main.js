const adb = require("adbkit")
const {serial, initSystem} = require('./device')

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
          const newDevice = await serial(device)
          devicesList[newDevice.id] = newDevice
          sender.send('fromMain', devicesList)
        }
      })
      tracker.on('remove', (device) => {
        console.log('Device %s was unplugged', device.id)
        if (devicesList.hasOwnProperty(device.id)){
          delete devicesList[device.id];
        }
        sender.send('fromMain', devicesList)
      })
      tracker.on('end', () => {
        console.log('Tracking stopped')
      })
    })
    .catch(function (err) {
      console.log('Something went wrong:', err.stack)
    })
}

const listDevices = (sender) => {
  client.listDevices()
    .then(async function (devices) {
      console.log('init listDevices ')
      for (let i = 0; i< devices.length; i++){
        const device = devices[i]
        if (!devicesList.hasOwnProperty(device.id)){
          if (device.type === 'device'){
            const newDevice = await serial(device)
            devicesList[newDevice.id] = newDevice
          }
        }else if(device.type !== 'device'){
          devicesList[devices.id] = devices
        }
      }
      sender.send('fromMain', devicesList)
    })
    .catch(function (err) {
      console.log('Something went wrong:', err.stack)
    })
}

module.exports={
  device_watch,
  listDevices,
  initSystem,
}
