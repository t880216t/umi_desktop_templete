var adb = require("adbkit")
const client = adb.createClient()
const aport = require('aport')

let devicesList = {}

exports.onDevices = function(sender){
  client.trackDevices()
    .then(function (tracker) {
      tracker.on('add',async function (device) {
        console.log('Device %s was plugged in', device.id)
        if (device.type === 'device'){
          const wsPort = await initDevice(device)
          device['port'] = wsPort
        }
        devicesList[device.id] = device
        sender.send('fromMain', devicesList)
      })
      tracker.on('remove', function (device) {
        console.log('Device %s was unplugged', device.id)
        if (devicesList.hasOwnProperty(device.id)){
          delete devicesList[device.id];
        }
        sender.send('fromMain', devicesList)
      })
      tracker.on('change', async function (device) {
        console.log('Device %s was changed', device.id)
        if (device.type === 'device'){
          const wsPort = await initDevice(device)
          device['port'] = wsPort
        }
        devicesList[device.id] = device
        sender.send('fromMain', devicesList)
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
      console.log('init listDevices ')
      devices && devices.forEach(async device => {
        if (device.type === 'device'){
          // const wsPort = await initDevice()
          // device['port'] = wsPort
        }
        devicesList[device.id] = device
      })
      sender.send('fromMain', devicesList)
    })
    .catch(function (err) {
      console.log('Something went wrong:', err.stack)
    })
}

async function initDevice(device) {
  const freePort = await aport()
  cleanAgent(device)
  pushAgent(device)
  startAgent(device)
  forwardAgent(device, freePort)
  return freePort
}

function cleanAgent(device) {
  client.shell(device.id, '/data/local/tmp/atx-agent server --stop')
    .then(adb.util.readAll)
    .then(function(output) {
      console.log('[%s] %s', device.id, output.toString().trim())
    })

  client.shell(device.id, 'rm -rf /data/local/tmp/atx-agent')
    .then(adb.util.readAll)
    .then(function(output) {
      console.log('[%s] %s', device.id, output.toString().trim())
    })
}

function startAgent(device) {
  client.shell(device.id, '/data/local/tmp/atx-agent server -d --stop')
    .then(adb.util.readAll)
    .then(function(output) {
      console.log('[%s] %s', device.id, output.toString().trim())
    })
}

function forwardAgent(device, freePort) {
  client.forward(device.id, `tcp:${freePort}`, 'tcp:7912')
    .then(function() {
      console.log('Setup devtools on "%s"', id)
    })
}

function pushAgent(device){
  client.push(device.id, 'public/atx-agent/atx-agent', '/data/local/tmp/atx-agent')
    .then(function(transfer) {
      return new Promise(function(resolve, reject) {
        transfer.on('progress', function(stats) {
          console.log('[%s] Pushed %d bytes so far',
            device.id,
            stats.bytesTransferred)
        })
        transfer.on('end', function() {
          console.log('[%s] Push complete', device.id)
          resolve()
        })
        transfer.on('error', reject)
      })
    })

  client.shell(device.id, 'chmod 755 /data/local/tmp/atx-agent')
    .then(adb.util.readAll)
    .then(function(output) {
      console.log('[%s] %s', device.id, output.toString().trim())
    })
}
