import React, { Component } from 'react';
import { List, Card } from 'antd';
import {connect, history} from 'umi';


import DeviceSyncCard from './DeviceSyncCard'
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
  }


  render() {
    const { deviceList, syncTouch2Device } = this.props;
    const { } = this.state;
    return (
      <Card>
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
              <DeviceSyncCard
                deviceInfo={serial}
                syncTouch2Device={syncTouch2Device}
              />
            </List.Item>
          )}
        />
      </Card>
    )
  }
}
