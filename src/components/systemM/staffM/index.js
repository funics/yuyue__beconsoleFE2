import React from 'react';
import { Card, Button, Input, Select, Form, Table, Divider, Modal } from 'antd';
import BreadcrumbCustom from '../../BreadcrumbCustom';
import { Link } from 'react-router-dom';
import URL from '../../../api/config';
import pagination from '../../pagination';// 翻页
import { parseParams } from '../../../axios/tools';// 翻页

const Option = Select.Option;
const confirm = Modal.confirm;
const StaffSearchForm = Form.create()(
    (props) => {
        function handleSubmit(e) {
            e.preventDefault();
            props.form.validateFields((err, values) => {
                if (!err) {
                    // console.log('2323232Received values of form: ', values);
                }
            });
            let options = {
                method: "GET",
                credentials: 'include', // 请求带上cookies，是每次请求保持会话一直
            }
            fetch(`${URL}`, options)
                .then((res) => {
                    res.json();
                })
                .then((data) => {
                    props.toF(data);
                })
        }
        const { getFieldDecorator } = props.form;
        const selectData = [{
            label: "所属机构",
            placeholder: "全部",
            name: "category",
            value: ['全部', '朝阳街道']
        }, {
            label: "所属部门",
            placeholder: "全部",
            name: "isSelected",
            value: ['全部', '技术部', '运维部'],
        }, {
            label: "状态",
            placeholder: "全部",
            name: "publisher",
            value: ['全部', '正常', '停用']
        }];
        return (
            <Form onSubmit={handleSubmit} layout="inline">
                <Form.Item label="姓名">
                    {getFieldDecorator('username', {
                        rules: [{
                            required: false, message: '',
                        }, {
                            // validator: this.validateUserName,
                        }],
                    })(
                        <Input placeholder="姓名" style={{ width: 120 }} />
                    )}
                </Form.Item>
                {selectData.map(i => (
                    <Form.Item key={i.name} label={i.label}>
                        {getFieldDecorator(i.name)(
                            <Select placeholder={i.placeholder} style={{ width: 120 }}>
                                {i.value.map(v => (<Option key={v} value={v}>{v}</Option>))}
                            </Select>
                        )}
                    </Form.Item>
                ))}
                <Form.Item>
                    <Button type="primary" htmlType="submit">查询</Button>
                </Form.Item>
            </Form>
        );
    }
);

class StaffM extends React.Component {

    state = {
        tableData: []
    }

    componentDidMount() {
        this.requestList();
    }
    // 翻页
    params = {
        currentPage: 1,//当前页面
        pageSize: 10,//每页大小
    }

    showConfirm = () => {
        confirm({
            title: 'Want to delete these items?',
            content: 'some descriptions',
            onOk() {
                console.log('OK');
            },
            onCancel() {
                console.log('Cancel');
            },
        });
    }
    tableFatherDataChange = (data) => {
        this.setState({ tableData: data })
    }
    requestList = () => {
        const url = `${URL}/system/users?${parseParams(params)}`;
        // 翻页
        let params = {
            start: this.params.currentPage - 1,
            size: this.params.pageSize,
        };
        // 翻页
        fetch(url, {
            method: 'GET',
            credentials: 'include', // 请求带上cookies，是每次请求保持会话一直
        })
            .then((res) => res.json())
            .then(data => {
                // console.log(data);
                // eslint-disable-next-line
                data.content.map((item) => {
                    item.key = item.uid;
                    item.beDepartment = item.beDepartment.name;
                    item.beInstitution = item.beInstitution.name;
                    item.status = item.status ? '正常' : '停用'
                });
                this.setState({
                    // 翻页
                    pagination: pagination(data, (current) => {//改变页码
                        this.params.currentPage = current;
                        this.requestList();
                    }, (size) => {//pageSize 变化的回调
                        this.params.pageSize = size;
                        this.requestList();
                    }),
                    tableData: data.content
                });
            })
            .catch(err => {
                console.log('fetch error', err)
            });
    }

    render() {

        const columns = [{
            title: '员工ID',
            dataIndex: 'uid',
        }, {
            title: '员工姓名',
            dataIndex: 'userName',
        }, {
            title: '手机号',
            dataIndex: 'telephone',
        }, {
            title: '所属机构',
            dataIndex: 'beInstitution',
        }, {
            title: '所属部门',
            dataIndex: 'beDepartment',
        }, {
            title: '角色',
            dataIndex: 'role',
        }, {
            title: '状态',
            dataIndex: 'status',
        }, {
            title: '操作',
            dataIndex: 'action',
            render: (text, record) => (
                <span>
                    {/* eslint-disable-next-line */}
                    <a href="javascript:;" onClick={this.showConfirm}>重置密码</a>
                    <Divider type="vertical" />
                    <Link to={`${this.props.match.url}/changeStaff/${record.uid}`}>修改</Link>
                    <Divider type="vertical" />
                    {/* eslint-disable-next-line */}
                    <a href="javascript:;">删除</a>
                </span>
            ),
        }];

        const { tableData } = this.state;

        return (
            <React.Fragment>
                <BreadcrumbCustom first="系统管理" second="员工管理" />
                <Card
                    title="员工管理"
                >
                    <StaffSearchForm tableChildDataChange={this.tableFatherDataChange} /><br />
                    <div style={{ marginBottom: '10px' }}>
                        <Button type="primary"><Link to={`${this.props.match.url}/addStaff`}>新增</Link></Button>
                    </div>
                    <Table className="infoC-table"
                        columns={columns}
                        dataSource={tableData}
                        // 翻页
                        pagination={this.state.pagination}
                        bordered
                    />
                </Card>
            </React.Fragment>
        );
    };
}

export default StaffM;
