import React, { Component } from 'react';
import { } from 'antd';
import { connect } from 'umi';

import styles from './index.less'


@connect(({ global, loading }) => ({
  global: global,
  loading: loading.models.global,
}))
export default class Page extends Component {
  state = {
  }

  componentWillMount() {
  }

  render() {
    const { } = this.state;
    return (
      <div>
        test
      </div>
    )
  }
}
