import {PageHeaderWrapper} from "@ant-design/pro-layout";
import React, { Component } from 'react';
import { } from 'antd';
import { connect, history } from 'umi';

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
    if (window.api){
      window.api.send("toMain", 'refresh');
      window.api.receive("fromMain", (data) => this.listenDevices(data));
    }
  }

  listenDevices = (data) => {
    this.setState({deviceList: Object.values(data)}, () => console.log(data) )
  }

  render() {
    const { deviceList } = this.state;
    return (
      <PageHeaderWrapper content="">
        <div>
          {deviceList && deviceList.map(serial => (
            <DeviceCard deviceInfo={serial} onClick={() => history.push(`/devicesPage/detail?deviceId=${serial.id}&port=${serial.port}`) } />
          ))}
        </div>
      </PageHeaderWrapper>
    )
  }
}
