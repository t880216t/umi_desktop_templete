import React, { Component } from 'react';
import { } from 'antd';
import { connect } from 'umi';

import styles from './index.less'


@connect(({ global, loading }) => ({
  global,
  loading: loading.models.global,
}))
export default class Page extends Component {
  constructor(props){
    super(props);
    this.state = {
      address: ''
    }
  }

  componentDidMount() {
    const { deviceId, localPort, currentIp } = this.props.location.query
    const address = `${currentIp}:${localPort}`
    this.setState({
      deviceId, address
    },() => {
      this.syncModalDisplay(deviceId, address)
      this.syncTouch(deviceId, address)
    })
  }

  syncModalDisplay = (deviceId, address) => {
    const ws = new WebSocket(`ws://${address}/minicap/broadcast`)
    ws.onclose = () => {
      console.log('close')
    }
    ws.onerror = function () {

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

  syncTouch = (deviceId, address) => {
    const element = this[`modal${deviceId}`];
    if (!element) {
      return
    }

    const ws = new WebSocket(`ws://${address}/minitouch`)

    ws.onopen = () => {
      console.log('minitouch connected')
      ws.send(JSON.stringify({
        operation: 'r',
      }))
      element.addEventListener('mousedown', mouseDownListener)
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
      ws.send(JSON.stringify({
        operation, // u, d, c, w
        index: 0,
        pressure: 0.5,
        xP: scaled.xP,
        yP: scaled.yP,
      }))
      ws.send(JSON.stringify({ operation: 'c' }))
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

  render() {
    const { address, deviceId } = this.state;
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
        </div>
        <div className={styles.actionContain}></div>
        <div className={styles.otherContain}></div>
      </div>
    )
  }
}
