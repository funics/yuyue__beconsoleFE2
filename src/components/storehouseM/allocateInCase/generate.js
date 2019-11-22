import React from 'react';
import { Card, Form, Button, Modal, Row, Col, message } from 'antd';
import { getFormItem } from '../../baseFormItem';
import "./index.less"
import Req from '../request';
import { typeConfig, wayConfig } from '../config/allocateRConfig';

const confirm = Modal.confirm;
const GenerateForm = Form.create()(
    class extends React.Component {
        render() {
            const { form, dataSource } = this.props;
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
            const formList = [
                { type: 'INPUT', label: '订单编号', name: 'orderNo', disabled: true },
                { type: 'SELECT', label: '调拨类型', name: 'bookcaseType', list: typeConfig[1] },
                { type: 'INPUT', label: '制单人', name: 'user1Name', disabled: true, initialValue: localStorage.getItem('user').replace(/^\"(\w+)\"$/g, "$1") },
                { type: 'SELECT', label: '调拨方', name: 'warehouseId', list: this.props.warehouseList, onChange: this.props.onWarehouseChange },
                { type: 'SELECT', label: '接收方', name: 'caseId', list: this.props.caseList },
                { type: 'RADIO', label: '方式', name: 'way', list: wayConfig },
            ].map(i => ((i.formItemLayout) ? i : { ...i, formItemLayout: formItemLayout }));
            if (dataSource) {
                formList.forEach(i => {
                    i.initialValue = dataSource[i.name];
                })
            }
            return (
                <Form onSubmit={this.props.onSubmit}>
                    <Row>
                        {getFormItem(form, formList).map((i, index) => (<Col key={index} span={8}>{i}</Col>))}
                    </Row>
                    <div style={{ textAlign: "center" }}>
                        <Button style={{ marginRight: '50px' }} size="large" type="primary" htmlType="submit">去选书</Button>
                    </div>
                </Form>
            );
        }
    }
);

class Generate extends React.Component {
    state = { data: [] }

    componentDidMount() {
        //从url读取id
        let id = new URLSearchParams(this.props.location.search).get("id");
        this.setState({ bookcaseId: id }, () => { this.requestList() })
    }

    componentWillReceiveProps(v) {
        //从url读取id
        let id = new URLSearchParams(v.location.search).get("id");
        //id值改变
        if (this.state.bookcaseId !== id) {
            this.setState({ bookcaseId: id }, () => { this.requestList() })
        }
    }

    requestList = () => {
        let id = this.state.bookcaseId;
        this.outStore_formRef.props.form.resetFields();//重置表单
        //获取仓库下拉框内容
        Req.getUserWarehouses().then(data => { this.setState({ warehouseList: data }) })
        if (id) {
            //获取调拨单内容
            Req.getBookcaseRecordsById(id).then(data => {
                this.setState({
                    dataSource: {
                        ...data,
                        user1Name: data.user1 && data.user1.userName,
                        warehouseId: data.beWarehouse.warehouseId + '',
                        caseId: data.bsBookcaseinfo.caseId + '',
                        bookcaseType: data.bookcaseType + '',
                        way: data.way + '',
                    }
                })
                let id = data.beWarehouse.warehouseId;
                //请求仓库对应的柜子下拉框选项
                id && Req.getCaseInfos(id).then(data => {
                    this.setState({
                        caseList: data
                    })
                })
            })
        }
    }

    /**
     * 保存
     */
    handleSave = () => {
        let _this = this;
        confirm({
            title: '确认保存该调拨单？',
            okText: '确认',
            cancelText: '取消',
            onOk() {
                let form = _this.outStore_formRef.props.form;
                form.validateFields((err, formValues) => {
                    if (!err) {
                        if (_this.state.bookcaseId) {/*更新调拨单*/
                            Req.putBookcaseRecords({
                                ...formValues,
                                status: "1",//状态：草稿
                                type: "1",//调拨入柜单
                                bsBookcaseinfo: { caseId: formValues.caseId },
                                beWarehouse: { warehouseId: formValues.warehouseId },
                                bookcaseId: _this.state.bookcaseId,
                            }).then(result => {
                                if (result) {
                                    message.success("更新成功 " + JSON.stringify(result.data))
                                    _this.requestList();//刷新页面
                                }
                            })
                        } else {/*新增调拨单*/
                            Req.postBookcaseRecords({
                                ...formValues,
                                status: "1",//状态：草稿
                                type: "1",//调拨入柜单
                                bsBookcaseinfo: { caseId: formValues.caseId },
                                beWarehouse: { warehouseId: formValues.warehouseId },
                                bookcaseId: _this.state.bookcaseId,
                            }).then(result => {
                                if (result) {
                                    let id = result.data;
                                    message.success("新增成功 " + JSON.stringify(result.data))
                                    _this.props.history.push(`/app/storehouseM/transferInData/generate?id=${id}`); //地址栏改变
                                }
                            })
                        }
                    }
                })
            }
        });
    }

    /**
     * 删除
     */
    handleDel = () => {
        let _this = this;
        confirm({
            title: '确认删除该调拨单？',
            okText: '确认',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                Req.deleteBookcaseRecords(_this.state.bookcaseId).then(result => {
                    if (result) {
                        message.success("删除" + JSON.stringify(result.data) + "成功")
                        _this.props.history.push('/app/storehouseM/transferInData');//跳转到调拨入柜单首页
                    }
                })
            }
        });
    }

    /**
     * 去选书
     */
    handleSubmit = () => {
        let form = this.outStore_formRef.props.form;
        form.validateFields((err, formValues) => {
            if (!err) {
                if (this.state.bookcaseId) {/*更新调拨单*/
                    Req.putBookcaseRecords({
                        ...formValues,
                        status: "1",//状态：选书
                        type: "1",//调拨入柜单
                        // bsBookcaseinfo: { caseId: formValues.caseId },
                        bsBookcaseinfo: { caseId: 8 },
                        beWarehouse: { warehouseId: 5 },
                        // beWarehouse: { warehouseId: formValues.warehouseId },
                        bookcaseId: this.state.bookcaseId,
                    }).then(result => {
                        if (result) {
                            message.success("更新成功 " + JSON.stringify(result.data))
                            this.props.history.push(`/app/storehouseM/transferInData/select?id=${this.state.bookcaseId}`);//跳转待出库界面
                        }
                    })
                } else {/*新增调拨单*/
                    Req.postBookcaseRecords({
                        ...formValues,
                        status: "2",//状态：选书
                        type: "1",//调拨入柜单
                        bsBookcaseinfo: { caseId: formValues.caseId },
                        beWarehouse: { warehouseId: formValues.warehouseId },
                        bookcaseId: this.state.bookcaseId,
                    }).then(result => {
                        if (result) {
                            let id = result.data;
                            message.success("新增成功 " + JSON.stringify(result.data))
                            this.props.history.push(`/app/storehouseM/transferInData/select?id=${id}`);//跳转待出库界面
                        }
                    })
                }
            }
        })
    }

    //仓库改变
    onWarehouseChange = (v) => {
        let form = this.outStore_formRef.props.form;
        form.setFieldsValue({ caseId: '' });
        Req.getCaseInfos(v).then(data => { this.setState({ caseList: data }) })
    }

    outStoreFormRef = (formRef) => {
        this.outStore_formRef = formRef;
    }

    render() {
        return (
            <div>
                <Card
                    title={<div>
                        <Button type="primary" onClick={this.handleSave}>保存</Button>
                        <Button type="primary" onClick={this.handleDel}>删除</Button>
                    </div>}
                >
                    <div style={{ textAlign: 'right' }}>
                        <Button type="primary" disabled>草稿</Button>
                    </div>
                    <h1 style={{ display: 'block', textAlign: 'center', fontSize: '26px', weight: 'bolder' }}>生成调拨入柜单</h1>
                    <GenerateForm
                        wrappedComponentRef={this.outStoreFormRef}
                        dataSource={this.state.dataSource}
                        warehouseList={this.state.warehouseList}
                        caseList={this.state.caseList}
                        onWarehouseChange={this.onWarehouseChange}//仓库改变
                        onSubmit={this.handleSubmit}
                    /><br />
                </Card>
            </div>
        )
    }
}

export default Generate;