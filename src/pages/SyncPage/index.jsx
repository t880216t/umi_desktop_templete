import {PageHeaderWrapper} from "@ant-design/pro-layout";
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
    }
  }

  componentDidMount() {
  }


  render() {
    const { } = this.state;
    return (
      <PageHeaderWrapper title="同步设备">
        test11232131
      </PageHeaderWrapper>
    )
  }
}
