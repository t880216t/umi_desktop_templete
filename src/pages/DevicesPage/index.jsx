import React, { Component } from 'react';
import { } from 'antd';
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
      deviceList: []
    }
  }

  componentDidMount() {
    window.api.send("toMain", 'refresh');
    window.api.receive("fromMain", (data) => this.listenDevices(data));
  }

  listenDevices = (data) => {
    this.setState({deviceList: data})
  }


  render() {
    const { deviceList } = this.state;
    return (
      <div>
        {deviceList && deviceList.map(serial => (
          <div key={serial.id}>
            <span>{serial.id}</span>
            <span>{serial.type}</span>
          </div>
        ))}
      </div>
    )
  }
}
