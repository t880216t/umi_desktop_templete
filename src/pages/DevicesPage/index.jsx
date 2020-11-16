import React, { Component } from 'react';
import { } from 'antd';
import { connect } from 'umi';

import DeviceCard from '../../components/DeviceCard'
import styles from './index.less'


@connect(({ global, loading }) => ({
  global,
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
          <DeviceCard deviceInfo={serial}  />
        ))}
      </div>
    )
  }
}
