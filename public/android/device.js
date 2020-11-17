const adb = require("adbkit")
const aport = require('aport')

const {deviceNames} = require('./device_names')

const client = adb.createClient()

async function getprop(device) {
  return client.getProperties(device.id)
    .then((properties) => {
      let deviceName = ''
      if (deviceNames.hasOwnProperty(properties['ro.product.model'])){
        deviceName = deviceNames[properties['ro.product.model']]
      }
      return {
        brand: properties['ro.product.brand'],
        model: properties['ro.product.model'],
        version: properties['ro.build.version.release'],
        sdk: properties['ro.build.version.sdk'],
        abi: properties['ro.product.cpu.abi'],
        abis: properties['ro.product.cpu.abilist'],
        name: deviceName,
      }
    })
}

const serial = async (device) => {
  const properties = await getprop(device)
  console.log(properties)
}

module.exports = {
  serial
}
