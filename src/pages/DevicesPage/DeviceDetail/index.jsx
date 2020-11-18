import React, { Component } from 'react';
import { Card } from 'antd';
import { connect } from 'umi';
import * as minicapDriver from 'minicap-driver'
import { minicapClient } from 'minicap-driver/dist/client'

import styles from './index.less'


@connect(({ global, loading }) => ({
  global: global,
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


  render() {
    const { address, deviceId } = this.state;
    return (
      <Card>
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
      </Card>
    )
  }
}
