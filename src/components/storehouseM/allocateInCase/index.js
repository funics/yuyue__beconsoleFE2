import React from 'react';
import { Form, Button, Card, Table, Row, Col, Radio, Input, DatePicker, Divider } from 'antd';
import BreadcrumbCustom from '../../BreadcrumbCustom';
import { getFormItem, getRadioList } from '../../baseFormItem';
import "./index.less";
import moment from 'moment';
import { statusConfig } from '../config/allocateRConfig';
import Req from '../request';
import pagination from '../../pagination';

// //调拨类型
// export const allocateType = {
//     "0": "铺新书",
//     "1": "其他",
// }

// //订单状态
// export const statusConfig = {
//     "0": "草稿",
//     "1": "选书",
//     "2": "待出库",
//     "3": "配送中",
//     "4": "已上柜",
//     "5": "差异待审核",
//     "6": "已完成",
// }

const InputGroup = Input.Group;
const { RangePicker } = DatePicker;
//时间输入框
class TimeInput extends React.Component {
    static getDerivedStateFromProps(nextProps) {
        // Should be a controlled component.
        if ('value' in nextProps) {
            return {
                ...(nextProps.value || {}),
            };
        }
        return null;
    }
    constructor(props) {
        super(props);
        const value = props.value || {};
        this.state = {
            timeType: value.timeType,
            timeRange: value.timeRange,
        };
    }
    handleRadioChange = (e) => {
        if (!('value' in this.props)) {
            this.setState({ timeType: e.target.value });
        }
        this.triggerChange({ timeType: e.target.value });
    }
    handleDateChange = (timeRange) => {
        if (!('value' in this.props)) {
            this.setState({ timeRange });
        }
        this.triggerChange({ timeRange });
    }
    triggerChange = (changedValue) => {
        // Should provide an event to pass value to Form.
        const onChange = this.props.onChange;
        if (onChange) {
            onChange(Object.assign({}, this.state, changedValue));
        }
    }
    render() {
        const radioList = [{ id: 'makeTime', name: '编制时间' }, { id: 'receiveTime', name: '接单时间' }, { id: 'putCaseTime', name: '上柜时间' }];
        return (
            <InputGroup compact>
                <Radio.Group
                    value={this.state.timeType}
                    onChange={this.handleRadioChange}
                >
                    {getRadioList(radioList)}
                </Radio.Group>
                <RangePicker
                    value={this.state.timeRange}
                    onChange={this.handleDateChange}
                />
            </InputGroup>
        );
    }
}

const AICSearch = Form.create()(
    class extends React.Component {
        handleSubmit = (e) => {
            e.preventDefault();
            let fieldsValue = this.props.form.getFieldsValue();
            console.log(fieldsValue);
        }

        render() {
            const { form } = this.props;
            const formItemLayout = {
                labelCol: {
                    xs: { span: 24 },
                    sm: { span: 5 },
                },
                wrapperCol: {
                    xs: { span: 24 },
                    sm: { span: 15 },
                },
            };
            const formItemLayout2 = {
                wrapperCol: {
                    span: 24,
                },
            };
            const formList = [
                { type: 'SELECT', label: '仓库', name: 'store', list: [] },
                { type: 'SELECT', label: '柜子', name: 'case', list: [] },
                { type: 'INPUT', label: '制单人', name: 'maker' },
                { type: 'SELECT', label: '调拨类型', name: 'type' },
                { type: 'SELECT', label: '订单状态', name: 'status' },
                { type: 'INPUT', label: '订单编号', name: 'code' },
                { type: 'SELECT', label: '方式', name: 'way' },
                { type: 'INPUT', label: '运维人', name: 'operator' },
                { type: 'OTHER', label: '', name: 'time', component: <TimeInput />, formItemLayout: formItemLayout2 },
                { type: 'INPUT', label: 'ISBN', name: 'isbn' },
                { type: 'INPUT', label: '电子标签', name: 'rfid' },
                { type: 'INPUT', label: '', name: 'fuzzyQuery', placeholder: '书籍名称/出版社/作者模糊查询' },
            ].map(i => ((i.formItemLayout) ? i : { ...i, formItemLayout: formItemLayout }));
            return (
                <Form onSubmit={this.handleSubmit}>
                    <Row>
                        {getFormItem(form, formList).map((i, index) => (formList[index].name === "time" ? <Col key={index} span={24}>{i}</Col> : <Col key={index} span={6}>{i}</Col>))}
                        <Button style={{ marginRight: '50px' }} type="primary" htmlType="submit">查询</Button>
                    </Row>
                </Form>
            );
        }
    }
);

class AllocateInCase extends React.Component {
    state = {

    }

    params = {
        currentPage: 1,//当前页面
        pageSize: 10,//每页大小
        /**搜索参数 */
        search: {
        },
    }

    componentDidMount() {
        this.requestList();
    }

    requestList = () => {
        let params = {
            start: this.params.currentPage - 1,
            size: this.params.pageSize,
            type: 1,
            ...this.params.search,
        };
        Req.getBookcaseRecords(params).then(data => {
            this.setState({
                pagination: pagination(data, (current) => {//改变页码
                    this.params.currentPage = current;
                    this.requestList();
                }, (size) => {//pageSize 变化的回调
                    this.params.pageSize = size;
                    this.requestList();
                }),
                dataSource: data.content.map(i => ({
                    ...i,
                    key: i.bookcaseId,
                    warehouseName: i.beWarehouse.warehouseName,
                    caseName: i.bsBookcaseinfo.caseName,
                    user1Name: i.user1 && i.user1.userName,
                    user2Name: i.user2 && i.user2.userName,
                    createTime: moment(i.createTime),
                    ordersTime: moment(i.ordersTime),
                }))
            })
        })
    }
    render() {
        const columns = [
            { title: '订单编号', dataIndex: 'orderNo' },
            { title: '调拨方', dataIndex: 'warehouseName' },
            { title: '接收方', dataIndex: 'caseName' },
            { title: '编制人', dataIndex: 'user1Name' },
            { title: '编制时间', dataIndex: 'createTime', render: (createTime) => createTime && createTime.format("YYYY-MM-DD HH:mm:ss") },
            { title: '运维人', dataIndex: 'user2Name' },
            { title: '接单时间', dataIndex: 'ordersTime', render: (ordersTime) => ordersTime && ordersTime.format("YYYY-MM-DD HH:mm:ss") },
            { title: '订单状态', dataIndex: 'status', render: status => statusConfig[status] },
            {
                title: '操作', dataIndex: 'action',
                render: (text, record) => (
                    action[record.status].map((i, index) => (
                        <span key={index}>
                            <a onClick={() => { i.onClick(record.bookcaseId) }}>{i.label}</a>
                            <Divider type="vertical" />
                        </span>
                    ))
                ),
            }
        ];

        const action = {
            "1": [{ label: '修改', onClick: (id) => { this.props.history.push(`/app/storehouseM/transferInData/generate?id=${id}`) } }],
            "2": [{ label: '修改', onClick: (id) => { this.props.history.push(`/app/storehouseM/transferInData/select?id=${id}`) } }],
            "3": [{ label: '接单', onClick: (record) => { this.props.history.push("/app/storehouseM/transferInData/receive") } }],
            "4": [{ label: '上柜', onClick: (record) => { this.props.history.push("/app/storehouseM/transferInData/put") } }, { label: '打印单据', onClick: (record) => { } }],
            "5": [{ label: '审核差距', onClick: (record) => { this.props.history.push("/app/storehouseM/transferInData/check") } }],
            "6": [{ label: '审核差距', onClick: (record) => { } }],
            "7": [{ label: '查看', onClick: (record) => { this.props.history.push("/app/storehouseM/transferInData/finished") } }],
        }

        return (
            <div className="">
                <BreadcrumbCustom first="仓库管理" second="调拨入柜单" />
                <Card
                    title="调拨入柜单查询"
                >
                    <AICSearch />
                    <div style={{ textAlign: "right" }}>
                        <Button
                            style={{ marginRight: '50px', marginBottom: '10px' }}
                            type="primary"
                            onClick={() => { this.props.history.push("/app/storehouseM/transferInData/generate") }}
                        >
                            新建
                        </Button>
                    </div>
                    <Table
                        className="allocateInCase-Table"
                        columns={columns}
                        dataSource={this.state.dataSource}
                        pagination={this.state.pagination}
                        bordered
                    />
                </Card>
            </div>

        )
    }
}

export default AllocateInCase;