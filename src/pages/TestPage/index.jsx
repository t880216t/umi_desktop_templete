import React, { Component } from 'react';
import { Tabs, List } from 'antd';
import { AppleOutlined, AndroidOutlined, LinkOutlined, RightOutlined } from '@ant-design/icons';

import styles from './index.less'

const { TabPane } = Tabs;

export default class Page extends Component {
  state = {
    androidLinks: [],
    iosLinks: [],
  }

  componentDidMount() {

  }

  render() {
    const {androidLinks, iosLinks } = this.state;
    return (
      <div className={styles.main}>
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                <AppleOutlined />
                安卓
              </span>
            }
            key="1"
          >
            <List
              bordered={false}
              dataSource={androidLinks}
              renderItem={item => (
                <List.Item>
                  <LinkOutlined /><a href={item.href} target={'_blank'}>{item.name}</a><RightOutlined />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <AndroidOutlined />
                苹果
              </span>
            }
            key="2"
          >
            <List
              bordered={false}
              dataSource={iosLinks}
              renderItem={item => (
                <List.Item>
                  <LinkOutlined /><a href={item.href} target={'_blank'}>{item.name}</a><RightOutlined />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </div>
    )
  }
}
