import React from 'react';
import { Card, Table, Divider, Tree, Input, Button, Icon, Modal, Row, Col, Radio, message, Popconfirm, Spin, Checkbox } from 'antd';
import './index.less';
import Url from '../../../api/config';
const { TreeNode } = Tree;
const Search = Input.Search;
const DirectoryTree = Tree.DirectoryTree;
const RadioGroup = Radio.Group;
const CheckGroup = Checkbox.Group;
const confirm = Modal.confirm;

class SelectModal extends React.Component {
    state = {
        searchValue: '',//书名模糊查询
        searchCategory: '',//目录查询
        treeData: [{//目录树行列表
            title: <span><Icon type="loading" />&emsp;书籍目录</span>,
            key: '0',
        }],
        loading: false,//查询加载
        Adding: false,//选择书籍loading
        data: [],//查询结果
    };

    componentDidMount() {
        this.requestCategory();
    }

    /**
     * 书籍目录获取
     */
    requestCategory = () => {
        fetch(`${Url}/website/bookcategories`, { credentials: 'include' })
            .then((res) => res.json()).then(data => {
                this.setState({
                    treeData: [{
                        title: "书籍目录",
                        key: '0',
                        children: this.fomatData(data)
                    }]
                })
            }).catch((err) => {
                console.log(err);
            })
    }

    /**
     * 书名&目录 查询
     */
    requestQuery = () => {
        fetch(`${Url}/website/bookinfo/${this.state.searchCategory}?bookName=${this.state.searchValue}`, { credentials: 'include' })
            .then((res) => res.json()).then(data => {
                this.setState({
                    data: data.map(i => ({
                        value: i.bookinfoId,
                        text: i.bookName,
                    })),
                    loading: false,
                })
            }).catch((err) => {
                console.log(err)
            })
    }

    //格式化目录数据
    fomatData = (data) => {
        return data.map(i => ({
            title: i.categoryName,
            key: i.categoryId,
            children: i.bsBookcategorys.length > 0 ? this.fomatData(i.bsBookcategorys) : null
        }))
    }

    //书名搜索
    onSearch = (v) => {
        this.setState({
            searchValue: v,
            loading: true,
        }, () => { this.requestQuery() });
    }

    //目录选择
    onSelect = (selectedKeys, e) => {
        let node = e.selectedNodes[0];
        if (node && node.props.isLeaf) {
            this.setState({
                searchCategory: node.key,
                loading: true,
            }, () => { this.requestQuery() })
        }
    }

    renderTreeNodes = (data) => (
        data.map((item) => {
            if (item.children) {
                return (
                    <TreeNode title={item.title} key={item.key}>
                        {this.renderTreeNodes(item.children)}
                    </TreeNode>
                );
            }
            return <TreeNode {...item} isLeaf />;
        })
    )

    renderRadios = (data) => {
        const radioStyle = {
            display: 'block',
            height: '30px',
            lineHeight: '30px',
        };
        const radios = data.map((item) => {
            let selected = this.props.selectedKeys.indexOf(item.value) > -1;//该书籍是否已经被选
            return <Radio style={radioStyle}
                disabled={selected}
                checked={selected}
                key={item.value}
                value={item.value}
                onClick={() => {
                    this.props.onSelectBook(item.value)
                }}>{item.text}
            </Radio>;
        })
        return radios;
    }

    renderCheckboxs = (data) => {
        const checkboxStyle = {
            display: 'block',
            height: '30px',
            lineHeight: '30px',
            whiteSpace: 'nowrap',
        };
        const checkboxs = data.map((item) => {
            let selected = this.props.selectedKeys.indexOf(item.value) > -1;//该书籍是否已经被选
            return <div key={item.value}>
                <Checkbox
                    style={checkboxStyle}
                    checked={selected}
                    value={item.value}
                    onChange={() => {
                        this.props.onSelectBook(item.value, this.state.searchCategory)
                    }}
                >{item.text}
                </Checkbox>
            </div>;
        })
        return checkboxs;
    }

    /**
     * 生成书单
     */
    handleGenerate = () => {
        let _this = this;
        confirm({
            title: '确认生成书单？',
            okText: '确认',
            cancelText: '取消',
            onOk() {
                _this.props.onGenerate();
            }
        });
    }

    render() {
        return (
            <Modal
                visible={this.props.visible}
                footer={null}
                onCancel={this.props.onClose}
                width={900}
            >
                <Spin spinning={this.state.Adding}>
                    <Row>
                        <Col span={11}>
                            <Search style={{ marginBottom: 8 }} placeholder="Search" onSearch={this.onSearch} enterButton />
                            <div style={{ overflow: 'auto', height: 500 }}>
                                <DirectoryTree
                                    defaultExpandedKeys={['0']}
                                    onSelect={this.onSelect}
                                >
                                    {this.renderTreeNodes(this.state.treeData)}
                                </DirectoryTree>
                            </div>
                        </Col>
                        <Col span={2}><Divider type="vertical" /></Col>
                        <Col span={11}>
                            <div style={{ overflow: 'auto', height: '530px', marginTop: '20px' }}>
                                <Spin spinning={this.state.loading}>
                                    {
                                        this.state.data.length > 0 ?
                                            this.props.type === 'radio' ?
                                                this.renderRadios(this.state.data)
                                                :
                                                this.renderCheckboxs(this.state.data)
                                            : <p style={{ textAlign: 'center' }}>No Data</p>
                                    }
                                </Spin>
                            </div>
                        </Col>
                    </Row>
                    {this.props.type === 'check' && <Button onClick={this.handleGenerate}>确认</Button>}
                </Spin>
            </Modal>
        )
    }
}

export default SelectModal;