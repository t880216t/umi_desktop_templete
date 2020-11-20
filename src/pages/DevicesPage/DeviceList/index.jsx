import React, { Component } from 'react';
import { Modal, Table, Tag } from 'antd';
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

  handleOk = () => {
    const {selectedRowKeys} = this.props;
    const {deviceList} = this.state;
    const selectDevices = deviceList.filter(item => selectedRowKeys.includes(item.id))
    if (this.props.onOk){
      this.props.onOk(selectDevices)
    }
  }


  render() {
    const { deviceList } = this.state;
    const { currentId, visible, onOk, onCancel, selectedRowKeys, onSelectChange } = this.props;
    const rowSelection = {
      selectedRowKeys,
      onChange: onSelectChange,
      getCheckboxProps: record => ({
        disabled: record.id === currentId,
      }),
    };
    const columns = [
      {
        title: '设备Id',
        dataIndex: 'id',
        render: (text,record) => <span>{text}  {record.id === currentId && <Tag color="#2db7f5">当前本机</Tag>}</span>,
      },
      {
        title: '设备名',
        dataIndex: 'name',
      },
      {
        title: '系统版本',
        dataIndex: 'version',
      },
      {
        title: '屏幕尺寸',
        dataIndex: 'screen',
        render: (text,record) => <span>{`${record.width} x ${record.height}`}</span>,
      },
    ];
    return (
      <Modal
        title="可同步设备列表"
        centered
        destroyOnClose
        visible={visible}
        onOk={() => this.handleOk()}
        onCancel={() => onCancel()}
        width={1000}
      >
        <Table size="small" rowKey="id" rowSelection={rowSelection} columns={columns} dataSource={deviceList} />
      </Modal>
    )
  }
}
