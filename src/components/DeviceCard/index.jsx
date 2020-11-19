import React, { Component } from 'react';
import { Card, Avatar, Descriptions } from 'antd';
import { connect } from 'umi';
import {
  AndroidFilled
} from '@ant-design/icons';

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
    const { deviceInfo, onClick } = this.props;
    return (
      <Card className={styles.cardContainer} hoverable key={deviceInfo.id} bordered={false} onClick={onClick}>
        <Card.Meta
          avatar={<Avatar style={{backgroundColor: '#ffffff'}} shape="square" size={64} icon={<AndroidFilled style={{color: '#87d068'}} />}/>}
          title={deviceInfo.name}
          description={
            <Descriptions size={'small'} column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}>
              <Descriptions.Item label="id">{deviceInfo.id}</Descriptions.Item>
              <Descriptions.Item label="version">{deviceInfo.version}</Descriptions.Item>
              <Descriptions.Item label="size">{`${deviceInfo.width} x ${deviceInfo.height}`}</Descriptions.Item>
            </Descriptions>
          }
        />
      </Card>
    )
  }
}
