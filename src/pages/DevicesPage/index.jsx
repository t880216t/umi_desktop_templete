import {PageHeaderWrapper} from "@ant-design/pro-layout";
import React, { Component } from 'react';
import { List } from 'antd';
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
      window.api.receive("fromMain", (data) => this.listenDevices(data));
      setTimeout(() => {window.api.send("toMain", 'refresh')}, 300)
    }
  }

  listenDevices = (data) => {
    this.setState({deviceList: Object.values(data)}, () => console.log(data) )
  }

  render() {
    const { deviceList } = this.state;
    return (
      <PageHeaderWrapper title="设备列表">
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 3,
            md: 4,
            lg: 4,
            xl: 5,
            xxl: 5,
          }}
          dataSource={deviceList}
          renderItem={serial => (
            <List.Item>
              <DeviceCard
                deviceInfo={serial}
                onClick={
                  () => history.push(`/devicesPage/detail?deviceId=${serial.id}&localPort=${serial.localPort}&currentIp=${serial.currentIp}`)
                }
              />
            </List.Item>
          )}
        />
      </PageHeaderWrapper>
    )
  }
}
