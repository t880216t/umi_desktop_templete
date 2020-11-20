const adb = require("adbkit")
const aport = require('aport')
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const extract = require('extract-zip')
const progressStream = require('progress-stream');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');
var net = require("net");

const {deviceNames} = require('./device_names')
const {libConfig} = require('./config')

const client = adb.createClient()

async function getprop(device) {
  return client.getProperties(device.id)
    .then((properties) => {
      let deviceName = properties['ro.product.model']
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
        id: device.id,
        type: device.type,
      }
    })
}

async function getScreenSize(device) {
  return client.framebuffer(device.id)
    .then(function(framebuffer) {
      const {meta} = framebuffer
      let width=0
      let height=0
      if (meta.version === 2){
        width = meta.height
        height = meta.red_offset
      }else {
        width = meta.width
        height = meta.height
      }
      return {width, height}
    })
}

async function pushFileToDevice(device, path, dest ) {
  return client.push(device.id, path, dest)
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
}

async function chmodDeviceFile(device, dest ) {
  return client.shell(device.id, `chmod 755 ${dest}`)
    .then(adb.util.readAll)
    .then(function(output) {
      console.log('[%s] %s', device.id, output.toString().trim())
    })
}

const mirror_download = async (url, filePath) => {
  const github_host = "https://github.com"
  if (url.startsWith(github_host)){
    const mirror_url = url.replace(github_host, "http://tool.appetizer.io")
    try{
      return await download(mirror_url, filePath)
    }catch (e) {
      console.log("download from mirror error, use origin source")
    }
  }
  return await download(url, filePath);
};

const download = async (fileURL, filePath) => {
  //下载保存的文件路径
  let fileSavePath = path.join(__dirname, 'vendor', path.basename(fileURL));
  //缓存文件路径
  let tmpFileSavePath = fileSavePath + ".tmp";
  //创建写入流
  const fileStream = fs.createWriteStream(tmpFileSavePath).on('error', function (e) {
    console.error('error==>', e)
  }).on('ready', function () {
    console.log("开始下载:", fileURL);
  }).on('finish', function () {
    //下载完成后重命名文件
    fs.renameSync(tmpFileSavePath, filePath);
    console.log('文件下载完成:', filePath);
    if (filePath.endsWith('.zip')){
      const zip_folder = filePath.replace('.zip','')
      unzip_stf(filePath, zip_folder)
    }
    if (filePath.endsWith('.tar.gz')){
      const zip_folder = filePath.replace('.tar.gz','')
      unzip_atx(filePath, zip_folder)
    }
  });
  //请求文件
  return fetch(fileURL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/octet-stream' },
    // timeout: 100,
  }).then(res => {
    //获取请求头中的文件大小数据
    let fsize = res.headers.get("content-length");
    //创建进度
    let str = progressStream({
      length: fsize,
      time: 100 /* ms */
    });
    // 下载进度
    str.on('progress', function (progressData) {
      //不换行输出
      let percentage = Math.round(progressData.percentage) + '%';
      console.log(percentage);
      // process.stdout.write('\033[2J'+);
      // console.log(progress);
    });
    res.body.pipe(str).pipe(fileStream);
  }).catch(e => {
    //自定义异常处理
    console.log(e);
  });
}

const unzip_stf = async (zip_path, unpackPath) => {
  //判断压缩文件是否存在
  if(!fs.existsSync(zip_path))  return;
  //创建解压缩对象
  try {
    const resolvedUnpackPath = path.resolve(unpackPath);
    console.log('resolvedUnpackPath :', resolvedUnpackPath)
    await extract(zip_path, { dir: resolvedUnpackPath })
    console.log('Extraction complete')
  } catch (err) {
    // handle any errors
    console.log('Extraction err', err)
  }
}

const unzip_atx = async (zip_path, unpackPath) => {
  //判断压缩文件是否存在
  if(!fs.existsSync(zip_path))  return;
  //创建解压缩对象
  try {
    const resolvedUnpackPath = path.resolve(unpackPath);
    console.log('resolvedUnpackPath :', resolvedUnpackPath)
    decompress(zip_path, resolvedUnpackPath, {
      plugins: [
        decompressTargz()
      ]
    }).then(() => {
      console.log('Extraction complete')
    })
  } catch (err) {
    // handle any errors
    console.log('Extraction err', err)
  }
}

const get_stf_binaries = async () => {
  const version = libConfig.stf_binaries
  const fileName = `stf-binaries-${version}.zip`
  const filePath = path.join(__dirname, 'vendor', fileName)
  if (fs.existsSync(filePath)) return;
  await mirror_download(`https://github.com/openatx/stf-binaries/archive/${version}.zip`, filePath)
}

const get_atx_agent= async () => {
  const version = libConfig.atx_agent
  const abiList = ["386", "amd64", "armv6", "armv7"]
  for (var i = 0; i < abiList.length; i++) {
    const fileName = `atx-agent-${version}-${abiList[i]}.tar.gz`
    const filePath = path.join(__dirname, 'vendor', fileName)
    if (fs.existsSync(filePath)) return;
    await mirror_download(`https://github.com/openatx/atx-agent/releases/download/${version}/atx-agent_${version}_linux_${abiList[i]}.tar.gz`, filePath)
  }
}

const get_whatsInput = async () => {
  const fileName = `WhatsInput_v1.0.apk`
  const filePath = path.join(__dirname, 'vendor', fileName)
  if (fs.existsSync(filePath)) return;
  await mirror_download(`https://github.com/openatx/atxserver2-android-provider/releases/download/v0.2.0/WhatsInput_v1.0.apk`, filePath)
}

const get_uiautomator_apk = async () => {
  const fileName = `app-uiautomator.apk`
  const filePath = path.join(__dirname, 'vendor', fileName)
  if (fs.existsSync(filePath)) return;
  await mirror_download(`https://github.com/openatx/android-uiautomator-server/releases/download/2.3.1/app-uiautomator.apk`, filePath)
}

const get_uiautomator_test_apk = async () => {
  const fileName = `app-uiautomator-test.apk`
  const filePath = path.join(__dirname, 'vendor', fileName)
  if (fs.existsSync(filePath)) return;
  await mirror_download(`https://github.com/openatx/android-uiautomator-server/releases/download/2.3.1/app-uiautomator-test.apk`, filePath)
}

const get_apks= async () => {
  await get_whatsInput()
  await get_uiautomator_apk()
  await get_uiautomator_test_apk()
}

async function init_binaries(device){
  const version = libConfig.stf_binaries
  const atx_agent_version = libConfig.atx_agent
  const zip_folder = `public/android/vendor/stf-binaries-${version}/stf-binaries-${version}`
  const preMinicap = zip_folder + "/node_modules/minicap-prebuilt/prebuilt/"
  const preMiniTouch = zip_folder + "/node_modules/minitouch-prebuilt/prebuilt/"
  const minicapSo = preMinicap + device.abi + "/lib/android-" + device.sdk + "/minicap.so"
  const minicap = preMinicap + device.abi + "/bin/minicap"
  const minitouch = preMiniTouch + device.abi + "/bin/minitouch"
  await pushFileToDevice(device, minicapSo, '/data/local/tmp/minicap.so')
  await chmodDeviceFile(device, '/data/local/tmp/minicap.so')
  await pushFileToDevice(device, minicap, '/data/local/tmp/minicap')
  await chmodDeviceFile(device, '/data/local/tmp/minicap')
  await pushFileToDevice(device, minitouch, '/data/local/tmp/minitouch')
  await chmodDeviceFile(device, '/data/local/tmp/minitouch')

  const abimaps = {
    'armeabi-v7a': `atx-agent-${atx_agent_version}-armv7`,
    'arm64-v8a': `atx-agent-${atx_agent_version}-armv7`,
    'armeabi': `atx-agent-${atx_agent_version}-armv6`,
    'x86': `atx-agent-${atx_agent_version}-386`,
  }

  if (!abimaps.hasOwnProperty(device.abi)){
    console.log("no avaliable abilist", device.abi)
    return
  }
  const atx_agent_file = `public/android/vendor/${abimaps[device.abi]}/atx-agent`
  await pushFileToDevice(device, atx_agent_file, '/data/local/tmp/atx-agent')
  await chmodDeviceFile(device, '/data/local/tmp/atx-agent')
}

async function init_apks(device){
  client.isInstalled(device.id,'com.buscode.whatsinput')
    .then(installed => {
      if (!installed){
        console.log("install whatsinput to ", device.id)
        const fileName = `WhatsInput_v1.0.apk`
        const filePath = path.join(__dirname, 'vendor', fileName)
        client.install(device.id, filePath)
      }
    })
  client.isInstalled(device.id,'com.github.uiautomator')
    .then(installed => {
      if (!installed){
        const fileName = `app-uiautomator.apk`
        const filePath = path.join(__dirname, 'vendor', fileName)
        console.log("install uiautomator to ", device.id)
        client.install(device.id, filePath)
      }
    })
  client.isInstalled(device.id,'com.github.uiautomator.test')
    .then(installed => {
      if (!installed){
        const fileName = `app-uiautomator-test.apk`
        const filePath = path.join(__dirname, 'vendor', fileName)
        console.log("install uiautomator test to ", device.id)
        client.install(device.id, filePath)
      }
    })
}

async function stopAgent(device) {
  return client.shell(device.id, '/data/local/tmp/atx-agent server --stop')
    .then(adb.util.readAll)
    .then(function(output) {
      console.log('[%s] %s', device.id, output.toString().trim())
    })
}

async function startAgent(device) {
  return client.shell(device.id, '/data/local/tmp/atx-agent server --nouia -d')
    .then(adb.util.readAll)
    .then(function(output) {
      console.log('[%s] %s', device.id, output.toString().trim())
    })
}

async function init_forwards(device, freePort) {
  return client.forward(device.id, `tcp:${freePort}`, 'tcp:7912')
    .then(async function() {
      console.log('Setup devtools on "%s"', device.id)
      const localPort = await aport()
      createTcpProxy(localPort,'localhost', freePort)
      return localPort
    })
}

async function createTcpProxy(localport, remotehost, remoteport){
  let server = net.createServer(function (localsocket) {
    let remotesocket = new net.Socket();

    remotesocket.connect(remoteport, remotehost);

    localsocket.on('connect', function (data) {
      console.log(">>> connection #%d from %s:%d",
        server.connections,
        localsocket.remoteAddress,
        localsocket.remotePort
      );
    });

    localsocket.on('data', function (data) {
      let flushed = remotesocket.write(data);
      if (!flushed) {
        localsocket.pause();
      }
    });

    remotesocket.on('data', function(data) {
      try{
        if (localsocket){
          let flushed = localsocket.write(data);
          if (!flushed) {
            remotesocket.pause();
          }
        }
      }catch (e) {
        console.log("err:", e)
      }

    });

    localsocket.on('drain', function() {
      remotesocket.resume();
    });

    remotesocket.on('drain', function() {
      localsocket.resume();
    });

    localsocket.on('close', function(had_error) {
      console.log("%s:%d - closing remote",
        localsocket.remoteAddress,
        localsocket.remotePort
      );
      remotesocket.end();
    });

    remotesocket.on('close', function(had_error) {
      console.log("%s:%d - closing local",
        localsocket.remoteAddress,
        localsocket.remotePort
      );
      localsocket.end();
    });

  });
  server.listen(localport);
}


async function initSystem() {
  await get_stf_binaries()
  await get_atx_agent()
  await get_apks()

}

async function init(device) {
  const freePort = await aport()
  const currentIp = await getIPAdress()
  await init_binaries(device)
  await init_apks(device)
  const localPort = await init_forwards(device, freePort)
  await stopAgent(device)
  await startAgent(device)
  device['port'] = freePort
  device['localPort'] = localPort
  device['currentIp'] = currentIp
  return device
}

const serial = async (device) => {
  const properties = await getprop(device)
  const {width, height} = await getScreenSize(device)
  console.log(properties)
  let newDevice = properties
  newDevice['id'] = device.id
  newDevice['type'] = device.type
  newDevice['width'] = width
  newDevice['height'] = height
  newDevice = await init(newDevice)
  return newDevice
}

async function getIPAdress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}

module.exports = {
  initSystem,
  serial,
}
