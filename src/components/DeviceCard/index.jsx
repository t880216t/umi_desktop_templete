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
    }
  }

  componentDidMount() {
  }


  render() {
    const { deviceInfo, onClick } = this.props;
    return (
      <Card className={styles.cardContainer} hoverable key={deviceInfo.id} bordered={false} onClick={onClick}>
        <div className={styles.phoneCard}>
          {/*<div  className={styles.phoneImg} style={{backgroundImage: `url(${deviceInfo.thumUrl})`}} alt=""/>*/}
          <div  className={styles.phoneImg} style={{backgroundImage: `url(https://www.apple.com.cn/v/iphone/home/ap/images/overview/compare/compare_iphone_12__btq63lk8td7m_large.jpg)`}} alt=""/>
          {/*<h2 className={styles.phoneName}>{deviceInfo.name}</h2>*/}
          <h2 className={styles.phoneName}>{deviceInfo.name}</h2>
          <span className={styles.phoneDesc}>{deviceInfo.id}</span>
        </div>
      </Card>
    )
  }
}
