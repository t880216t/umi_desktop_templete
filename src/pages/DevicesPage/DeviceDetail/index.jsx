import React, { Component } from 'react';
import { Card } from 'antd';
import { connect } from 'umi';
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
    }
  }

  componentDidMount() {
    const { deviceId, port } = this.props.location.query
    console.log(deviceId, port)
    minicapClient(`ws://localhost:${parseInt(port)}`, '#canvas')
  }


  render() {
    const { } = this.state;
    return (
      <Card>
        <canvas id="canvas"></canvas>
      </Card>
    )
  }
}
