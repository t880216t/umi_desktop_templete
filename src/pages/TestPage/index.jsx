import React, { Component } from 'react';
import { Tabs, List } from 'antd';
import { connect } from 'umi';
import { AppleOutlined, AndroidOutlined, LinkOutlined, RightOutlined } from '@ant-design/icons';

import styles from './index.less'

const { TabPane } = Tabs;

@connect(({ global, loading }) => ({
  global: global,
  loading: loading.models.global,
}))
export default class Page extends Component {
  state = {
    androidLinks: [
      {
        'name': 'App Featured频道页',
        'href': 'micbuyer://launcher?action=HomeFeatured'
      },
      {
        'name': 'App Discover频道',
        'href': 'micbuyer://launcher?action=HomeInformation'
      },
      {
        'name': 'App Discover频道带+资讯组Id',
        'href': 'micbuyer://launcher?action=HomeInformation&target=UEnmmGxJkQYQ'
      },
      {
        'name': 'App Discover频道资讯页+bQEJnfxMdmpH',
        'href': 'micbuyer://launcher?action=HomeInformationDetail&target=bQEJnfxMdmpH'
      },
      {
        'name': 'App 云展宣传页',
        'href': 'micbuyer://launcher?action=ExpoList'
      },
      {
        'name': 'App 云展预热页+联合展会ID',
        'href': 'micbuyer://launcher?action=ExpoPreheat&target=snExmZJGzQIa'
      },
      {
        'name': 'App 云展主会场+联合展会ID',
        'href': 'micbuyer://launcher?action=ExpoAggregation&target=snExmZJGzQIa'
      },
      {
        'name': 'App 云展分会场+分会场ID',
        'href': 'micbuyer://launcher?action=ExpoDetail&target=MxEnkhQYjJlo'
      },
      {
        'name': '产品搜索结果页',
        'href': 'micbuyer://launcher?action=ProductSearchResult&target=500ml'
      },
      {
        'name': '目录搜索结果页+目录id',
        'href': 'micbuyer://launcher?action=ProductCategorySearchResult&catCode=1001000000&keyword=500ml'
      },
      {
        'name': 'App RFQ宣传页',
        'href': 'micbuyer://launcher?action=RfqIntroduce'
      },
      {
        'name': 'App RFQ发布',
        'href': 'micbuyer://launcher?action=RfqPost'
      },
      {
        'name': 'App 登录页',
        'href': 'micbuyer://launcher?action=Login'
      },
      {
        'name': 'App 注册页',
        'href': 'micbuyer://launcher?action=Register'
      },
    ],
    iosLinks: [
      {
        'name': 'App Featured频道页',
        'href': 'https://special.made-in-china.com/app/buyer/homefeatured'
      },
      {
        'name': 'App Discover频道',
        'href': 'https://special.made-in-china.com/app/buyer/homeinformation'
      },
      {
        'name': 'App Discover频道+资讯组Id',
        'href': 'https://special.made-in-china.com/app/buyer/homeinformation?target=UEnmmGxJkQYQ'
      },
      {
        'name': 'App Discover频道资讯页+bQEJnfxMdmpH',
        'href': 'https://special.made-in-china.com/app/buyer/homeinformationdetail?target=bQEJnfxMdmpH'
      },
      {
        'name': 'App 云展宣传页',
        'href': 'https://special.made-in-china.com/app/buyer/expolist'
      },
      {
        'name': 'App 云展预热页+联合展会ID',
        'href': 'https://special.made-in-china.com/app/buyer/expopreheat?target=snExmZJGzQIa'
      },
      {
        'name': 'App 云展主会场+联合展会ID',
        'href': 'https://special.made-in-china.com/app/buyer/expoaggregation?target=snExmZJGzQIa'
      },
      {
        'name': 'App 云展分会场+分会场ID',
        'href': 'https://special.made-in-china.com/app/buyer/expodetail?target=MxEnkhQYjJlo'
      },
      {
        'name': '产品搜索结果页',
        'href': 'https://special.made-in-china.com/app/buyer/productsearchresult?keyword=500ml'
      },
      {
        'name': '目录搜索结果页+目录id',
        'href': 'https://special.made-in-china.com/app/buyer/productcategorysearchresult?catcode=1001000000&keyword=500ml'
      },
      {
        'name': 'App RFQ宣传页',
        'href': 'https://special.made-in-china.com/app/buyer/rfqintroduce'
      },
      {
        'name': 'App RFQ发布',
        'href': 'https://special.made-in-china.com/app/buyer/rfqpost'
      },
      {
        'name': 'App 登录页',
        'href': 'https://special.made-in-china.com/app/buyer/login'
      },
      {
        'name': 'App 注册页',
        'href': 'https://special.made-in-china.com/app/buyer/register'
      },
    ],
  }

  componentWillMount() {
    // const {dispatch} = this.props
    // if (dispatch) {
    //   dispatch({
    //     type: 'global/changeLayoutCollapsed',
    //     payload: {},
    //   });
    // }
  }

  render() {
    const {androidLinks, iosLinks } = this.state;
    return (
      <div className={styles.main}>
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                <AndroidOutlined />
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
                <AppleOutlined />
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
