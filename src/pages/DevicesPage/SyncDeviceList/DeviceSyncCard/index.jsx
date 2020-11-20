import {PageHeaderWrapper} from "@ant-design/pro-layout";
import React, { Component } from 'react';
import { Card } from 'antd';
import { connect } from 'umi';

import styles from './index.less'


@connect(({ global, loading }) => ({
  global: global,
  loading: loading.models.global,
}))
export default class Page extends Component {
  constructor(props){
    super(props);
    this.state = {
      deviceId: '',
      address: '',
    }
  }

  componentDidMount() {
    const { deviceInfo: {id, localPort, currentIp} } = this.props
    const address = `${currentIp}:${localPort}`
    this.setState({
      deviceId: id, address
    },() => {
      this.getRotattion(address)
      this.syncModalDisplay(id, address)
      this.syncTouch2Other(id, address)
    })
  }

  componentWillUnmount() {
  }

  getRotattion = (deviceUrl) => {
    fetch(`http://${deviceUrl}/info/rotation`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    })
  }

  syncModalDisplay = (deviceId, address) => {
    const ws = new WebSocket(`ws://${address}/minicap/broadcast`)
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
      console.log('onopen sync card')
    }
  }

  syncTouch2Other = (deviceId, address) => {
    if (this.props.syncTouch2Device){
      this.props.syncTouch2Device(deviceId, address)
    }
  }


  render() {
    const { deviceInfo } = this.props;
    return (
      <Card
        hoverable
        cover={
          <div className={styles.deviceImgWarp}>
            <img
              ref={ref => {
                this[`modal${deviceInfo.id}`] = ref;
              }}
              draggable={false}
              src={`http://${deviceInfo.currentIp}:${deviceInfo.localPort}/screenshot?t=${new Date().getTime()}`}
              alt=""
            />
          </div>
        }
      >
        <Card.Meta title={deviceInfo.name} description={`${deviceInfo.width} x ${deviceInfo.height}`} />
      </Card>
    )
  }
}
