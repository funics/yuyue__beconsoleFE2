import React from 'react';
import { Card, Form, Button, Divider, Table } from 'antd';
import BreadcrumbCustom from '../../BreadcrumbCustom';
import { getFormItem } from '../../baseFormItem';
import "./index.less"
import Link from 'react-router-dom/Link';
import Url from '../../../api/config';
import pagination from '../../pagination';
import { parseParams } from '../../../axios/tools';
import moment from 'moment';

//库单分类
export const recordTypeConfig = {
    '0': '入库单',
    '1': '出库单',
};

//库单状态
export const statusConfig = {
    '1': '草稿', '2': '待审核', '3': '已审核',
};

//库单类型
export const typeConfig = {
    //入库单
    '0': { '0': '其他', '1': '新书', '2': '捐书', '3': '还书' },
    //出库单
    '1': { '0': '其他', '1': '退货', '2': '报损', '3': '领用' },
};

const InStoreSearch = Form.create()(
    class extends React.Component {
        handleSubmit = (e) => {
            e.preventDefault();
            let fieldsValue = this.props.form.getFieldsValue();
            console.log(fieldsValue);
        }

        render() {
            const { form } = this.props;
            const formList = [
                { type: 'SELECT', label: '仓库', name: 'store', width: '100px', list: [] },
                { type: 'INPUT', label: '制单人', name: 'creator' },
                { type: 'INPUT', label: '审核人', name: 'checkman' },
                { type: 'SELECT', label: '订单类型', name: 'orderType', width: '100px', list: [] },
                { type: 'SELECT', label: '订单状态', name: 'orderState', width: '100px', list: [] },
                { type: 'INPUT', label: '订单编号', name: 'orderCode' },
                { type: 'RANGPICKER', label: '制单时间', name: 'createTime' },
                { type: 'RANGPICKER', label: '审核时间', name: 'checkTime' },
                { type: 'INPUT', label: 'ISBN', name: 'isbn' },
                { type: 'INPUT', label: '电子标签', name: 'eLabel' },
                { type: 'INPUT', placeholder: '书籍名称/出版社/作者模糊查询', name: 'fuzzyQuery', width: '300px' },
            ];
            return (
                <Form layout="inline" onSubmit={this.handleSubmit}>
                    {getFormItem(form, formList)}
                    <Form.Item>
                        <Button type="primary" htmlType="submit">查询</Button>
                    </Form.Item>
                </Form>
            );
        }
    }
);

class InStoreData extends React.Component {
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
            ...this.params.search,
        };
        fetch(`${Url}/warehouse/storagerecords?${parseParams(params)}`, { credentials: 'include' })
            .then((res) => res.json()).then(result => {
                let data = result;
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
                        key: i.orderNo,
                        warehouseName: i.warehouse.warehouseName,
                        user1Name: i.user1.userName,
                        user2Name: i.user2.userName,
                        createTime: moment(i.createTime),
                        reviewTime: moment(i.reviewTime),
                    }))
                })
            }).catch((err) => {
                console.log(err);
            })
    }

    handleSubmit = (params) => {
        console.log(params);
    }

    render() {
        const columns = [
            { title: '订单编号', dataIndex: 'orderNo' },
            { title: '仓库', dataIndex: 'warehouseName' },
            { title: '类型', dataIndex: 'type', render: (type) => typeConfig[0][type] },
            { title: '入库人', dataIndex: 'user1Name' },
            { title: '入库时间', dataIndex: 'createTime', render: (createTime) => createTime && createTime.format("YYYY-MM-DD HH:mm:ss") },
            { title: '审核人', dataIndex: 'user2Name' },
            { title: '审核时间', dataIndex: 'reviewTime', render: (reviewTime) => reviewTime && reviewTime.format("YYYY-MM-DD HH:mm:ss") },
            { title: '运费', dataIndex: 'fee' },
            { title: '订单状态', dataIndex: 'status', render: (status) => statusConfig[status]},
            {
                title: '操作', dataIndex: 'action',
                render: (text, record) => {
                    let config = {
                        '1': <Link to={`${this.props.match.url}/add`}>编辑</Link>,
                        '2': <Link to={`${this.props.match.url}/check`}>审核</Link>,
                        '3': <Link to={`${this.props.match.url}/detail`}>查看</Link>,
                    }
                    return config[record.status];
                }
            }
        ];

        return (
            <div className="" >
                <BreadcrumbCustom first="仓库管理" second="入库单" />
                <Card
                    title="入库单查询"
                >
                    <InStoreSearch handleSubmit={this.handleSubmit} />
                    <div style={{ textAlign: 'right' }}>
                        <Button type="primary" ><Link to={`${this.props.match.url}/add`}>新建</Link></Button>
                        <Button type="primary" onClick={this.handleExport}>导出</Button>
                    </div><br />
                    <Table
                        className="inStoreData-table"
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

export default InStoreData;