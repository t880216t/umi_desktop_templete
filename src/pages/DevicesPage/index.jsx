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

  initAdb = () => {
    this.adbClient.trackDevices()
      .then(function(tracker) {
        tracker.on('add', function(device) {
          console.log('Device %s was plugged in', device.id)
        })
        tracker.on('remove', function(device) {
          console.log('Device %s was unplugged', device.id)
        })
        tracker.on('end', function() {
          console.log('Tracking stopped')
        })
      })
      .catch(function(err) {
        console.error('Something went wrong:', err.stack)
      })
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
