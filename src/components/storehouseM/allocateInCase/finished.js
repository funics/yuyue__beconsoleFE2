import React from 'react';
import { Card, Button, Row, Select, Table, Col } from 'antd';
import { getOptionList } from '../../baseFormItem';
import "./index.less"

const listBase = [
    { label: '订单编号', name: 'code' },
    { label: '调拨类型', name: 'type' },
    { label: '制单人', name: 'maker' },
    { label: '制单时间', name: 'makeTime' },
    { label: '调拨方', name: 'allocator' },
    { label: '接收方', name: 'recevier' },
    { label: '方式', name: 'way' },
    { label: '运维人', name: 'operator' },
    { label: '接单时间', name: 'receiveTime' },
    { label: '审核人', name: 'checkMan' },
    { label: '审核时间', name: 'checkTime' },
];

class Finished extends React.Component {
    state = {
        operator: "1",
        listDet: { "code": "T20181012001" },
        dataSource: [
            { key: 1, caseCode: "100", bookName: "小岛经济学", rfid: "78364178326148", state: "待发货" },
            { key: 2, caseCode: "100", bookName: "小岛经济学", rfid: "78364178326148", state: "已取消" },
            { key: 3, caseCode: "100", bookName: "小岛经济学", rfid: "78364178326148", state: "待发货" },
        ],
        reason: "格子故障",
        total: 100, //格子总数
        full: 10, //补齐格子数
    }

    render() {
        const { listDet, full, dataSource, total } = this.state;
        const columns = [
            { title: '格子编号', dataIndex: 'caseCode' },
            { title: '书名', dataIndex: 'bookName' },
            { title: '电子标签', dataIndex: 'rfid' },
            { title: '状态', dataIndex: 'state', render: (state) => (state === "已取消" ? <font style={{ color: "red" }}>{state}</font> : state) },
        ];
        return (
            <div>
                <Card>
                    <div style={{ textAlign: 'right' }}>
                        <Button type="primary" disabled>已完成</Button>
                    </div>
                    <h1 style={{ display: 'block', textAlign: 'center', fontSize: '26px', weight: 'bolder' }}>调拨入柜单</h1>
                    <Row>
                        {
                            listBase.map(i => (
                                <Col key={i.name} span={6} style={{ lineHeight: "40px" }}>
                                    <span style={{ fontWeight: "bold" }}>{i.label}:</span>
                                    {
                                        i.name === "operator" ?
                                            <Select
                                                value={this.state.operator}
                                                style={{ width: "100px", marginLeft: 8 }}
                                                onChange={(value) => { this.setState({ operator: value }) }}
                                            >
                                                {getOptionList([{ id: "0", name: "王五" }, { id: "1", name: "小明" }])}
                                            </Select> :
                                            <span style={{ paddingLeft: 8 }}>{listDet[i.name]}</span>
                                    }
                                </Col>
                            ))
                        }
                    </Row><br />
                    <Table
                        className="allocateInCase-Table"
                        columns={columns}
                        dataSource={dataSource}
                        pagination={{
                            showTotal: (total, range) => `第 ${range[0]} 条到第 ${range[1]} 条，共 ${total} 条`,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50']
                        }}
                        footer={() => <p>共计：{total}个空格，已完成{full}个格子补书&emsp;&emsp;<font style={{ color: "red" }}>存在一个差异，请回收书籍</font></p>}
                        bordered
                    />
                    <p>
                        原因: &emsp;{this.state.reason}
                    </p>
                </Card>
            </div>
        )
    }
}

export default Finished;