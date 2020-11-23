import React, { Component } from 'react';
import { Row, Col, Card, Tooltip, Menu } from 'antd';
import { connect } from 'umi';
import {
  SelectOutlined,
  SwitcherOutlined,
  PoweroffOutlined,
  LeftOutlined,
  HomeOutlined,
  RetweetOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import { ContextMenuTrigger, ContextMenu } from 'react-contextmenu-lite';

import DeviceList from '../DeviceList'
import SyncDeviceList from '../SyncDeviceList'
import {
  getXPath,
  getXPathLite,
  getNodeByPath,
} from './common/xpath';
import { getNodePathByXY } from './common/bounds';
import { getDeviceHierarchy, getNodeByNode } from './common/android';
import {debounce} from '../../../utils/utils'
import styles from './index.less'

const xml2map = require('xml2map');
const _ = require('lodash')

@connect(({ global, loading }) => ({
  global,
  loading: loading.models.global,
}))
export default class Page extends Component {
  constructor(props){
    super(props);
    this.state = {
      deviceId: '',
      address: '',
      getNodeing: false,
      showSelect: false,
      selectedDevices: [],
      syncDevices: [],
      pageNode: null,
    }
    this.miniCapWs = null
    this.miniTouchWs = null
  }

  componentDidMount() {
    const { deviceId, localPort, currentIp, width, height } = this.props.location.query
    const address = `${currentIp}:${localPort}`
    this.setState({
      deviceId, address, width, height
    },() => {
      this.getRotattion(address)
      this.syncModalDisplay(deviceId, address)
      this.syncTouch(deviceId, address)
    })
  }

  componentWillUnmount() {
    if (this.miniCapWs){
      this.miniCapWs.close()
    }
    if (this.miniTouchWs){
      this.miniTouchWs.close()
    }
    if (this.reconnectMiniCapTimer){
      clearInterval(this.reconnectMiniCapTimer)
    }
    if (this.reconnectMiniTouchTimer){
      clearInterval(this.reconnectMiniTouchTimer)
    }
    if (this.deviceNode){
      this.deviceNode.removeEventListener('mousemove', this.handleMouseMoveInDevice)
    }
  }

  linstenMouseMoveInDeviceWarp = () => {
    if (this.deviceNode) {
      this.deviceNode.addEventListener('mousemove', this.handleMouseMoveInDevice)
    }
  }

  handleMouseMoveInDevice = debounce((event) => {
    let e = event;
    if (e.originalEvent) {
      e = e.originalEvent
    }
    e.preventDefault()
    const {height, width, pageNode} = this.state;
    const contextNode = document.getElementById('mainDevice')
    if (contextNode && contextNode.style.opacity == 0){
      if (pageNode && height && width){
        const x = e.offsetX;
        const y = e.offsetY
        const w = e.target.clientWidth;
        const h = e.target.clientHeight
        const scaled = this.coords(w, h, x, y, this.rotation);
        const poinstX = width*(scaled.xP)
        const poinstY = height*(scaled.yP)
        const nodePath = getNodePathByXY(pageNode, poinstX, poinstY);
        if (nodePath){
          const node = getNodeByPath(pageNode, nodePath)
          if (this.deviceNode && node && this.deviceNode.getBoundingClientRect){
            const {bounds, text} = node
            const resourceId = node['resource-id']
            const containWidth = this.deviceNode.getBoundingClientRect().width
            const containHeight = this.deviceNode.getBoundingClientRect().height
            let currentNode = node;
            currentNode.nodePath = nodePath
            currentNode.name = resourceId || text
            currentNode.hlightBounds = [
              containWidth * (bounds[0]/width),
              containHeight * (bounds[1]/height),
              containWidth * (bounds[2]/width),
              containHeight * (bounds[3]/height),
            ]
            this.setState({currentNode})
          }
        }
      }
    }
  },100)

  handleGetNode = (address) => {
    this.setState({getNodeing: !this.state.getNodeing},() => this.handleHierarchy(address))
  }

  getRotattion = (deviceUrl) => {
    fetch(`http://${deviceUrl}/info/rotation`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    })
  }

  handleHierarchy = (deviceUrl) => {
    fetch(`http://${deviceUrl}/dump/hierarchy`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    })
      .then(res => res.json())
      .then(response => {
        var xml = response.result;
        xml = xml.replace(/content-desc=\"\"/g, 'content-desc="null"');
        const {hierarchy} = xml2map.tojson(xml);
        const adaptor = function(node) {
          if (node.bounds) {
            const bounds = node.bounds.match(/[\d\.]+/g);
            node.bounds = [
              ~~bounds[0],
              ~~bounds[1],
              bounds[2] - bounds[0],
              bounds[3] - bounds[1]
            ];
          }

          if (node.node) {
            node.nodes = node.node.length ? node.node : [node.node];
            node.nodes.forEach(adaptor);
            delete node.node;
          }

          return node;
        };

        let data;

        const matchedNode = _.findLast(hierarchy.node, i => {
          return (
            i !== null &&
            typeof i === 'object' &&
            i.package !== 'com.android.systemui'
          );
        });

        const FilterMatchedNode = _.findLast(matchedNode, i => {
          return (
            i['resource-id'] !== 'android:id/statusBarBackground'
          )
        })

        try {
          data = adaptor(FilterMatchedNode);
        } finally {
          this.setState({pageNode: data}, () => {
            this.linstenMouseMoveInDeviceWarp()
          })
        }
      })
  }

  handleShowSelect = () => {
    this.setState({showSelect: true})
  }


  handleSelectOk = (devices) => {
    this.setState({syncDevices: devices, showSelect: false})
  }

  syncTouch2Device = (id, adddres) => {
    this.syncTouch2OneDevice(id, adddres)
  }


  handleSelectCancel = () => {
    this.setState({
      showSelect: false,
    })
  }

  handleClick = (location) => {
    const {width, height, pageNode} = this.state;
    const { operation, xP, yP} = location
    const x = width*xP
    const y = height*yP
    if (pageNode && operation === 'u' && !(pageNode instanceof Array)){
      const nodePath = getNodePathByXY(pageNode, x, y);
      console.log(getXPath(pageNode, nodePath))
      console.log(getXPathLite(pageNode, nodePath))
    }
  }


  handleSelectChange = (e) => {
    this.setState({selectedDevices: e})
  }

  syncModalDisplay = (deviceId, address) => {
    const ws = new WebSocket(`ws://${address}/minicap/broadcast`)
    this.miniCapWs = ws
    ws.onclose = () => {
      console.log('close')
    }
    ws.onerror = function () {
      // this.reconnectMiniCapTimer = setInterval(() => this.syncModalDisplay(deviceId, address), 1000)
    }
    ws.onmessage = message => {
      if (!this[`modal${deviceId}`]) {
        ws.close()
        return
      }
      if (message.data instanceof Blob) {
        const blob = new Blob([message.data], {
          type: 'image/jpeg',
        })
        const URL = window.URL || window.webkitURL
        const u = URL.createObjectURL(blob)
        this[`modal${deviceId}`].src = u
        this[`modal${deviceId}`].onload = function () {
          URL.revokeObjectURL(u)
        }
      } else if (/data size: /.test(message.data)) {
        // console.log("receive message:", message.data)
      } else if (/^rotation/.test(message.data)) {
        this.rotation = parseInt(message.data.substr('rotation '.length), 10);
        console.log('rotation:', this.rotation)
      } else {
        console.log('receive message:', message.data)
      }
    }
    ws.onopen = function () {
      console.log('onopen')
    }
  }

  coords = (boundingW, boundingH, relX, relY, rotation) => {
    let w;
    let h;
    let x;
    let y;
    switch (rotation) {
      case 0:
        w = boundingW
        h = boundingH
        x = relX
        y = relY
        break
      case 90:
        w = boundingH
        h = boundingW
        x = boundingH - relY
        y = relX
        break
      case 180:
        w = boundingW
        h = boundingH
        x = boundingW - relX
        y = boundingH - relY
        break
      case 270:
        w = boundingH
        h = boundingW
        x = relY
        y = boundingW - relX
        break
      default:
        break
    }

    return {
      xP: x / w,
      yP: y / h,
    }
  }

  syncTouch2OneDevice = (deviceId, address) => {
    this[`ws${deviceId}`] = new WebSocket(`ws://${address}/minitouch`)
    this[`ws${deviceId}`].onopen = () => {
      console.log('sync minitouch connected')
    }
    this[`ws${deviceId}`].onerror = function () {
      // this.reconnectMiniTouchTimer = setInterval(() => this.syncTouch(deviceId, address), 1000)
    }

    this[`ws${deviceId}`].onclose = () => {
      console.log('sync minitouch closed')
    }
  }


  syncTouch = (deviceId, address) => {
    const element = this[`modal${deviceId}`];
    if (!element) {
      return
    }

    const ws = new WebSocket(`ws://${address}/minitouch`)
    this.miniTouchWs = ws

    ws.onopen = () => {
      console.log('minitouch connected')
      ws.send(JSON.stringify({
        operation: 'r',
      }))
      element.addEventListener('mousedown', mouseDownListener)
    }
    ws.onerror = function () {
      // this.reconnectMiniTouchTimer = setInterval(() => this.syncTouch(deviceId, address), 1000)
    }
    ws.onmessage = () => {
      if (!this[`modal${deviceId}`]) {
        ws.close()
      }
    }

    ws.onclose = () => {
      console.log('minitouch closed')
      element.removeEventListener('mousedown', mouseDownListener)
    }

    const touchSync = (operation, event) => {
      let e = event;
      if (e.originalEvent) {
        e = e.originalEvent
      }
      e.preventDefault()

      const x = e.offsetX;
      const y = e.offsetY
      const w = e.target.clientWidth;
      const h = e.target.clientHeight
      const scaled = this.coords(w, h, x, y, this.rotation);
      const location = JSON.stringify({
        operation, // u, d, c, w
        index: 0,
        pressure: 0.5,
        xP: scaled.xP,
        yP: scaled.yP,
      })
      ws.send(location)
      ws.send(JSON.stringify({ operation: 'c' }))
      // this.handleClick({operation, xP: scaled.xP, yP: scaled.yP}) // 获取点击元素定位数据
      // const {selectedDevices, showSelect} = this.state;  // 坐标同步点击
      // if (selectedDevices&&!showSelect){
      //   selectedDevices.forEach(id => {
      //     if (this[`ws${id}`]){
      //       this[`ws${id}`].send(location)
      //       this[`ws${id}`].send(JSON.stringify({ operation: 'c' }))
      //     }
      //   })
      // }
    }

    function mouseMoveListener(event) {
      if (event.button !== 0) {
        return
      }
      touchSync('m', event)
    }

    function mouseUpListener(event) {
      if (event.button !== 0) {
        return
      }
      touchSync('u', event)
      element.removeEventListener('mousemove', mouseMoveListener);
      document.removeEventListener('mouseup', mouseUpListener);
    }

    function mouseDownListener(event) {
      if (event.button !== 0) {
        return
      }
      touchSync('d', event)
      element.addEventListener('mousemove', mouseMoveListener);
      document.addEventListener('mouseup', mouseUpListener)
    }
  }

  postAction = (deviceUrl, actionName) => {
    const actionEvent = () => {
      switch (actionName) {
        case 'recent':
          return 'input keyevent 187'
        case 'home':
          return 'input keyevent 3'
        case 'back':
          return 'input keyevent 4'
        case 'power':
          return 'input keyevent 26'
        default:
          return ''
      }
    }
    fetch(`http://${deviceUrl}/shell?command=${actionEvent()}`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
    })
      .then(() => {
        this.getRotattion(deviceUrl)
      })
  }

  postMessageToDevice = (deviceAddress, bounds) => {
    const x = bounds[0] + (bounds[2]/2)
    const y = bounds[1] + (bounds[3]/2)
    console.log(x, y)
    const cmd = `input tap ${x} ${y}`
    fetch(`http://${deviceAddress}/shell?command=${cmd}`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
    })
      .then(() => {
        const { getNodeing, address } = this.state;
        if (getNodeing && address === deviceAddress){
          this.handleHierarchy(address)
        }
      })
  }

  handleOneClick = () => {
    const { currentNode, syncDevices, address } = this.state;
    if (currentNode) {
      this.postMessageToDevice(address, currentNode.bounds)
      if (currentNode && syncDevices) {
        syncDevices.forEach(async device => {
          const address = `${device.currentIp}:${device.localPort}`
          const deviceHierarchyNode = await getDeviceHierarchy(address)
          const node = await getNodeByNode(deviceHierarchyNode, currentNode)
          if (node) {
            this.postMessageToDevice(address, node.bounds)
          }
        })
      }
    }
  }

  render() {
    const { address, deviceId, showSelect, selectedDevices, syncDevices, currentNode, getNodeing } = this.state;
    return (
      <div className={styles.detailWarp} >
        <div className={styles.deviceContain}>
          <ContextMenuTrigger id="mainDevice">
            <div ref={ref => {this.deviceNode = ref}} className={styles.deviceNode}>
              <img
                ref={ref => {
                  this[`modal${deviceId}`] = ref;
                }}
                draggable={false}
                src={`http://${address}/screenshot?t=${new Date().getTime()}`}
                alt=""
              />
              <div
                title={currentNode ? currentNode.name : null}
                className={styles.hlightBox}
                style={
                  currentNode ?
                    {left: currentNode.hlightBounds[0], top: currentNode.hlightBounds[1],width: currentNode.hlightBounds[2],height : currentNode.hlightBounds[3]}
                    :
                    {display: 'none'}} />
            </div>
          </ContextMenuTrigger>
          {getNodeing && (
            <ContextMenu id="mainDevice">
              <Menu>
                <Menu.Item onClick={() => this.handleOneClick()}>单次点击</Menu.Item>
                <Menu.Item>同步输入</Menu.Item>
                <Menu.SubMenu title="同步校验">
                  <Menu.Item>单个元素</Menu.Item>
                  <Menu.Item>整个页面</Menu.Item>
                </Menu.SubMenu>
              </Menu>
            </ContextMenu>
          )}
          <div className={styles.actionContain}>
            <Row>
              <Col span={6}>
                <div className={styles.actionWarpper} onClick={() => this.postAction(address, 'recent')}>
                  <SwitcherOutlined />
                </div>
              </Col>
              <Col span={6}>
                <div className={styles.actionWarpper} onClick={() => this.postAction(address, 'home')}>
                  <HomeOutlined />
                </div>
              </Col>
              <Col span={6}>
                <div className={styles.actionWarpper} onClick={() => this.postAction(address, 'back')}>
                  <LeftOutlined />
                </div>
              </Col>
              <Col span={6}>
                <div className={styles.actionWarpper} onClick={() => this.postAction(address, 'power')}>
                  <PoweroffOutlined />
                </div>
              </Col>
            </Row>
          </div>
        </div>
        <div className={styles.actionContain1}>
          <Card bordered={false} bodyStyle={{maxHeight: '95vh', padding: 5,  width: '120%', overflowY: 'scroll'}}>
            <Tooltip placement="right" title="监测页面结构数据">
              <Card.Grid className={styles.actionB} onClick={() => this.handleGetNode(address)} style={{textAlign: 'center', width: '98%'}}>
                <SelectOutlined style={{fontSize: 24, color: getNodeing ? 'blue': ''}} />
              </Card.Grid>
            </Tooltip>
            <Tooltip placement="right" title="刷新主控机屏幕旋转位置">
              <Card.Grid className={styles.actionB} onClick={() => this.getRotattion(address)} style={{textAlign: 'center', width: '98%'}}>
                <RetweetOutlined style={{fontSize: 24}} />
              </Card.Grid>
            </Tooltip>
            <Tooltip placement="right" title="选择设备，进行同步操作">
              <Card.Grid className={styles.actionB} onClick={() => this.handleShowSelect()} style={{textAlign: 'center', width: '98%'}}>
                <OrderedListOutlined style={{fontSize: 24}} />
              </Card.Grid>
            </Tooltip>
          </Card>
        </div>
        <div className={styles.otherContain}>
          {syncDevices && syncDevices.length >0 && (<SyncDeviceList deviceList={syncDevices} syncTouch2Device={this.syncTouch2Device}/>)}
        </div>
        {showSelect && (
          <DeviceList
            currentId={deviceId}
            visible={showSelect}
            selectedRowKeys={selectedDevices}
            onOk={(e) => this.handleSelectOk(e)}
            onCancel={() => this.handleSelectCancel()}
            onSelectChange={(e) => this.handleSelectChange(e)}
          />
        )}
      </div>
    )
  }
}
