import React, { Component } from 'react';
import { Row, Col, Card, Tooltip } from 'antd';
import { connect } from 'umi';
import {
  SwitcherOutlined,
  PoweroffOutlined,
  LeftOutlined,
  HomeOutlined,
  RetweetOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';

import DeviceList from '../DeviceList'
import SyncDeviceList from '../SyncDeviceList'

import styles from './index.less'


@connect(({ global, loading }) => ({
  global,
  loading: loading.models.global,
}))
export default class Page extends Component {
  constructor(props){
    super(props);
    this.state = {
      address: '',
      showSelect: false,
      selectedDevices: [],
      syncDevices: [],
    }
    this.miniCapWs = null
    this.miniTouchWs = null
  }

  componentDidMount() {
    const { deviceId, localPort, currentIp } = this.props.location.query
    const address = `${currentIp}:${localPort}`
    this.setState({
      deviceId, address
    },() => {
      this.getRotattion(address)
      this.syncModalDisplay(deviceId, address)
      this.syncTouch(deviceId, address)
    })
  }

  componentWillUnmount() {
    if (this.miniCapWs){
      this.miniCapWs.close()
    }
    if (this.miniTouchWs){
      this.miniTouchWs.close()
    }
    if (this.reconnectMiniCapTimer){
      clearInterval(this.reconnectMiniCapTimer)
    }
    if (this.reconnectMiniTouchTimer){
      clearInterval(this.reconnectMiniTouchTimer)
    }
  }

  getRotattion = (deviceUrl) => {
    fetch(`http://${deviceUrl}/info/rotation`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    })
  }

  handleShowSelect = () => {
    this.setState({showSelect: true})
  }


  handleSelectOk = (devices) => {
    this.setState({syncDevices: devices, showSelect: false})
  }

  syncTouch2Device = (id, adddres) => {
    this.syncTouch2OneDevice(id, adddres)
  }


  handleSelectCancel = () => {
    this.setState({
      showSelect: false,
    })
  }


  handleSelectChange = (e) => {
    this.setState({selectedDevices: e})
  }

  syncModalDisplay = (deviceId, address) => {
    const ws = new WebSocket(`ws://${address}/minicap/broadcast`)
    this.miniCapWs = ws
    ws.onclose = () => {
      console.log('close')
    }
    ws.onerror = function () {
      // this.reconnectMiniCapTimer = setInterval(() => this.syncModalDisplay(deviceId, address), 1000)
    }
    ws.onmessage = message => {
      if (!this[`modal${deviceId}`]) {
        ws.close()
        return
      }
      if (message.data instanceof Blob) {
        const blob = new Blob([message.data], {
          type: 'image/jpeg',
        })
        const URL = window.URL || window.webkitURL
        const u = URL.createObjectURL(blob)
        this[`modal${deviceId}`].src = u
        this[`modal${deviceId}`].onload = function () {
          URL.revokeObjectURL(u)
        }
      } else if (/data size: /.test(message.data)) {
        // console.log("receive message:", message.data)
      } else if (/^rotation/.test(message.data)) {
        this.rotation = parseInt(message.data.substr('rotation '.length), 10);
        console.log('rotation:', this.rotation)
      } else {
        console.log('receive message:', message.data)
      }
    }
    ws.onopen = function () {
      console.log('onopen')
    }
  }

  coords = (boundingW, boundingH, relX, relY, rotation) => {
    let w;
    let h;
    let x;
    let y;
    switch (rotation) {
      case 0:
        w = boundingW
        h = boundingH
        x = relX
        y = relY
        break
      case 90:
        w = boundingH
        h = boundingW
        x = boundingH - relY
        y = relX
        break
      case 180:
        w = boundingW
        h = boundingH
        x = boundingW - relX
        y = boundingH - relY
        break
      case 270:
        w = boundingH
        h = boundingW
        x = relY
        y = boundingW - relX
        break
      default:
        break
    }

    return {
      xP: x / w,
      yP: y / h,
    }
  }

  syncTouch2OneDevice = (deviceId, address) => {
    this[`ws${deviceId}`] = new WebSocket(`ws://${address}/minitouch`)
    this[`ws${deviceId}`].onopen = () => {
      console.log('sync minitouch connected')
    }
    this[`ws${deviceId}`].onerror = function () {
      // this.reconnectMiniTouchTimer = setInterval(() => this.syncTouch(deviceId, address), 1000)
    }

    this[`ws${deviceId}`].onclose = () => {
      console.log('sync minitouch closed')
    }
  }


  syncTouch = (deviceId, address) => {
    const element = this[`modal${deviceId}`];
    if (!element) {
      return
    }

    const ws = new WebSocket(`ws://${address}/minitouch`)
    this.miniTouchWs = ws

    ws.onopen = () => {
      console.log('minitouch connected')
      ws.send(JSON.stringify({
        operation: 'r',
      }))
      element.addEventListener('mousedown', mouseDownListener)
    }
    ws.onerror = function () {
      // this.reconnectMiniTouchTimer = setInterval(() => this.syncTouch(deviceId, address), 1000)
    }
    ws.onmessage = () => {
      if (!this[`modal${deviceId}`]) {
        ws.close()
      }
    }

    ws.onclose = () => {
      console.log('minitouch closed')
      element.removeEventListener('mousedown', mouseDownListener)
    }

    const touchSync = (operation, event) => {
      let e = event;
      if (e.originalEvent) {
        e = e.originalEvent
      }
      e.preventDefault()

      const x = e.offsetX;
      const y = e.offsetY
      const w = e.target.clientWidth;
      const h = e.target.clientHeight
      const scaled = this.coords(w, h, x, y, this.rotation);
      const location = JSON.stringify({
        operation, // u, d, c, w
        index: 0,
        pressure: 0.5,
        xP: scaled.xP,
        yP: scaled.yP,
      })
      ws.send(location)
      ws.send(JSON.stringify({ operation: 'c' }))
      const {selectedDevices, showSelect} = this.state;
      if (selectedDevices&&!showSelect){
        selectedDevices & selectedDevices.forEach(id => {
          if (this[`ws${id}`]){
            this[`ws${id}`].send(location)
            this[`ws${id}`].send(JSON.stringify({ operation: 'c' }))
          }
        })
      }
    }

    function mouseMoveListener(event) {
      touchSync('m', event)
    }

    function mouseUpListener(event) {
      touchSync('u', event)
      element.removeEventListener('mousemove', mouseMoveListener);
      document.removeEventListener('mouseup', mouseUpListener);
    }

    function mouseDownListener(event) {
      touchSync('d', event)
      element.addEventListener('mousemove', mouseMoveListener);
      document.addEventListener('mouseup', mouseUpListener)
    }
  }

  postAction = (deviceUrl, actionName) => {
    const actionEvent = () => {
      switch (actionName) {
        case 'recent':
          return 'input keyevent 187'
        case 'home':
          return 'input keyevent 3'
        case 'back':
          return 'input keyevent 4'
        case 'power':
          return 'input keyevent 26'
        default:
          return ''
      }
    }
    fetch(`http://${deviceUrl}/shell?command=${actionEvent()}`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
    })
      .then(() => {
        this.getRotattion(deviceUrl)
      })
  }

  render() {
    const { address, deviceId, showSelect, selectedDevices, syncDevices } = this.state;
    return (
      <div className={styles.detailWarp} >
        <div className={styles.deviceContain}>
          <img
            ref={ref => {
              this[`modal${deviceId}`] = ref;
            }}
            draggable={false}
            src={`http://${address}/screenshot?t=${new Date().getTime()}`}
            alt=""
          />
          <div className={styles.actionContain}>
            <Row>
              <Col span={6}>
                <div className={styles.actionWarpper} onClick={() => this.postAction(address, 'recent')}>
                  <SwitcherOutlined />
                </div>
              </Col>
              <Col span={6}>
                <div className={styles.actionWarpper} onClick={() => this.postAction(address, 'home')}>
                  <HomeOutlined />
                </div>
              </Col>
              <Col span={6}>
                <div className={styles.actionWarpper} onClick={() => this.postAction(address, 'back')}>
                  <LeftOutlined />
                </div>
              </Col>
              <Col span={6}>
                <div className={styles.actionWarpper} onClick={() => this.postAction(address, 'power')}>
                  <PoweroffOutlined />
                </div>
              </Col>
            </Row>
          </div>
        </div>
        <div className={styles.actionContain1}>
          <Card bordered={false} bodyStyle={{maxHeight: '95vh', padding: 5,  width: '120%', overflowY: 'scroll'}}>
            <Tooltip placement="right" title="刷新主控机屏幕旋转位置">
              <Card.Grid className={styles.actionB} onClick={() => this.getRotattion(address)} style={{textAlign: 'center', width: '98%'}}>
                <RetweetOutlined style={{fontSize: 24}} />
              </Card.Grid>
            </Tooltip>
            <Tooltip placement="right" title="选择设备，进行同步操作">
              <Card.Grid className={styles.actionB} onClick={() => this.handleShowSelect()} style={{textAlign: 'center', width: '98%'}}>
                <OrderedListOutlined style={{fontSize: 24}} />
              </Card.Grid>
            </Tooltip>
          </Card>
        </div>
        <div className={styles.otherContain}>
          {syncDevices && syncDevices.length >0 && (<SyncDeviceList deviceList={syncDevices} syncTouch2Device={this.syncTouch2Device}/>)}
        </div>
        {showSelect && (
          <DeviceList
            currentId={deviceId}
            visible={showSelect}
            selectedRowKeys={selectedDevices}
            onOk={(e) => this.handleSelectOk(e)}
            onCancel={() => this.handleSelectCancel()}
            onSelectChange={(e) => this.handleSelectChange(e)}
          />
        )}
      </div>
    )
  }
}
