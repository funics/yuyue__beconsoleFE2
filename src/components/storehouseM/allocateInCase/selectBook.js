import React from 'react';
import { Card, Button, Row, Select, Table, Col, Popconfirm, message, Modal } from 'antd';
import { getOptionList } from '../../baseFormItem';
import "./index.less"
import SelectModal from './selectModal';
import Req from '../request';
import moment from 'moment';
import { typeConfig, wayConfig } from '../config/allocateRConfig';
const confirm = Modal.confirm;

/**调拨表头单基本信息配置 */
const listBase = [
    { label: '订单编号', name: 'orderNo' },
    { label: '调拨类型', name: 'bookcaseType' },
    { label: '制单人', name: 'user1Name' },
    { label: '制单时间', name: 'createTime' },
    { label: '调拨方', name: 'warehouseName' },
    { label: '接收方', name: 'caseName' },
    { label: '方式', name: 'way' },
    { label: '运维人', name: 'user2Name' },
];

class SelectBook extends React.Component {
    state = {
        operator: "1",
        /**运维人下拉框*/
        optionList: {},
        /**调拨单基本信息*/
        listDet: {},
        /**表格中的数据*/
        dataSource: [],
        /**格子总数*/
        total: 100,
        /**补齐格子数*/
        full: 10,
        /**选书弹框*/
        modal: false,
        /**选择的书籍项*/
        selectedItems: [],
        /**选中书籍id*/
        selectedKeys: []
    }

    componentWillMount() {
        this.init()
    }

    componentDidMount() {
        //从url读取id
        let id = new URLSearchParams(this.props.location.search).get("id");
        this.setState({ bookcaseId: id }, () => { this.requestList() })
    }

    /**
     * 数据初始化
     */
    init = () => {
        this.params = {
            /**空闲格子id数组 */
            emptyCells: [],
            /**无效格子数目，即保存的格子不再是空闲状态 */
            invalidNum: 0,
            /**选择书籍的表格序号 */
            currentIndex: '',
            /**删除的原先保存在调拨单中的数据 */
            deleteData: [],
            /**
             * 书单
             * 用于自动铺书，生成书单
             * 0: 儿童类类书籍
             * 1：社科类
             * 2：其他
             */
            bookList: [[], [], []],
        }
    }

    /**
     * 页面刷新
     */
    requestList = () => {
        this.init();
        let id = this.state.bookcaseId;
        if (id) {
            //获取调拨单内容
            Req.getBookcaseRecordsById(id).then(data => {
                this.setState({
                    listDet: {
                        ...data,
                        orderNo: data.orderNo,
                        bookcaseType: typeConfig[1][data.bookcaseType],
                        user1Name: data.user1 && data.user1.userName,
                        createTime: moment(data.createTime).format("YYYY-MM-DD HH:mm:ss"),
                        warehouseName: data.beWarehouse.warehouseName,
                        caseName: data.bsBookcaseinfo.caseName,
                        way: wayConfig[data.way],
                        user2Name: data.user2 && data.user2.userName,
                    }
                })
                let caseId = data.bsBookcaseinfo.caseId;
                //获取空闲格子
                Req.getEmptyCells(caseId).then(cells => {
                    let dataSrc = [];
                    let emptyCells = [];
                    cells.map(i => {
                        let id = i.cellId;
                        emptyCells = emptyCells.concat(id)
                        dataSrc = dataSrc.concat([{ key: id, cellId: id }])
                    })
                    this.params.emptyCells = emptyCells;
                    this.setState({ dataSource: dataSrc }, () => {
                        //填充已保存的书籍项
                        let books = [];
                        let bookinfoIds = [];
                        data.rsBookcaserecorditems.map(i => {
                            let book = {
                                // key: i.bsBookcellinfo.cellId,
                                // cellId: i.bsBookcellinfo.cellId,
                                bookName: i.bookName,
                                locationId: i.beLocation.locationId,
                                rfid: i.rfid,
                                bookId: i.bookId,
                                bookcaseitemId: i.bookcaseitemId,
                                bookinfoId: i.bookinfoId,
                            };
                            books.push({ ...book, key: i.bsBookcellinfo.cellId, cellId: i.bsBookcellinfo.cellId, });
                            bookinfoIds.push(i.bookinfoId);
                            this.addBookList(book, 2);//加到BookList其他类别中
                        })
                        this.handleAddBook(books);
                        this.addSelectedKeys(bookinfoIds)
                    })
                })
                //获取运维人员下拉框选项
                Req.getOperateUsers(caseId).then(operators => {
                    if (operators.length > 0) {
                        let list = {};
                        operators.map(i => {
                            list[i.uid] = i.userName;
                        })
                        this.setState({ optionList: list })
                    }
                })
            })
        }
    }

    /**
     * 向table添加书籍
     * @param {*} books 书籍Array
     */
    handleAddBook = (books) => {
        let { dataSource } = this.state;
        books.map(book => {
            let index = this.params.emptyCells.indexOf(book.key);
            if (index > -1) {//格子空闲
                dataSource[this.params.invalidNum + index] = book;
            } else {//格子已被占用
                dataSource.splice(this.params.invalidNum, 0, { ...book, disabled: 1 });
                this.params.invalidNum++;
            }
        })
        this.setState({ dataSource: dataSource });
    }

    /**
     * 选择书籍-------用于手动铺书
     * @param {*} bookinfoId 书籍id
     */
    handleSelectBook = (bookinfoId) => {
        let warehouseId = this.state.listDet.beWarehouse.warehouseId;
        let index = this.params.currentIndex;
        let dataSource = this.state.dataSource;
        Req.getBookById(bookinfoId, warehouseId).then(data => {
            if (data) {
                let oldBookinfoId = dataSource[index].bookinfoId;
                if (oldBookinfoId) {//在selectedKeys数组中，删除原来的bookinfoId
                    this.rmSelectedKeys([oldBookinfoId]);
                }
                //添加到“选中的书籍ID”数组中
                this.addSelectedKeys([bookinfoId]);
                //更新书籍列表
                dataSource[index].bookinfoId = bookinfoId;
                dataSource[index].bookName = data.bsBookinfo.bookName;
                dataSource[index].rfid = data.rfid;
                dataSource[index].locationId = data.beLocation.locationId;
                dataSource[index].bookId = data.bookId;
                this.setState({ dataSource: dataSource, modal: false });
            }
        })
    }

    /**
     * 选择书籍生成书单------用于自动铺书
     * @param {*} bookinfoId 书籍id
     * @param {*} categoryId 目录id  01开头：儿童类  09开头：人文社科类
     */
    handleCheckBooks = (bookinfoId, categoryId) => {
        if (this.getBookListLength() >= this.params.emptyCells.length) {
            message.error("所选书籍数超过格子总数！");
            return;
        }
        let warehouseId = this.state.listDet.beWarehouse.warehouseId;
        let { bookList } = this.params;
        let index = this.indexOfSelectedKeys(bookinfoId);
        if (index > -1) {//取消原来的选中状态
            console.log("selectedKeys", this.state.selectedKeys)
            let book = this.getBookinList(index);
            console.log("bookinfoId", bookinfoId)
            book.bookcaseitemId && this.params.deleteData.push({ ...book, isDelete: 1 });
            this.rmSelectedKeys([bookinfoId]);
            this.rmBookList(index);
        } else {
            Req.getBookById(bookinfoId, warehouseId).then(data => {
                if (data) {
                    let book = {
                        bookinfoId: bookinfoId,
                        bookName: data.bsBookinfo.bookName,
                        rfid: data.rfid,
                        locationId: data.beLocation.locationId,
                        bookId: data.bookId,
                    };
                    if (/^01\d*/.test(categoryId)) {//儿童类
                        let len = bookList[0].length;
                        this.addBookList(book, 0);
                        this.addSelectedKeys(bookinfoId, len - 1);
                    } else if (/^09\d*/.test(categoryId)) {//人文社科类
                        let len = bookList[0].length + bookList[1].length;
                        this.addBookList(book, 1);
                        this.addSelectedKeys(bookinfoId, len - 1);
                    } else {//其他类别
                        this.addBookList(book, 2);
                        this.addSelectedKeys(bookinfoId);
                    }
                }
            })
        }
    }

    /**
     * 删除书籍----手动铺书时
     */
    handleDelBook1 = () => {
        let index = this.params.currentIndex;
        let dataSource = this.state.dataSource;
        //删除的是原来保存在调拨单中的数据
        if (dataSource[index].bookcaseitemId) {
            this.params.deleteData.push({ ...dataSource[index], isDelete: 1 })
            //如果删除的是无效格子信息，无效计数invalid减1
            index < this.params.invalidNum && this.params.invalidNum--;
        }
        //从“选中的书籍ID”数组中移除
        this.rmSelectedKeys([dataSource[index].bookinfoId])
        //更新表格数据
        dataSource[index] = { key: dataSource[index].key, cellId: dataSource[index].cellId }
        this.setState({ dataSource: dataSource });
    }

    /**
     * 删除书籍----自动铺书时
     * @param {*} record 书籍信息
     */
    handleDelBook2 = (record) => {
        let index = this.params.currentIndex;
        let dataSource = this.state.dataSource;
        //删除bookList中对应的项
        this.rmBookList(this.indexOfSelectedKeys(dataSource[index].bookinfoId));
        //删除的是原来保存在调拨单中的数据
        if (record.bookcaseitemId) {
            this.params.deleteData.push({ ...record, isDelete: 1 })
            //如果删除的是无效格子信息，无效计数invalid减1
            index < this.params.invalidNum && this.params.invalidNum--;
        }
        //从“选中的书籍ID”数组中移除
        this.rmSelectedKeys([record.bookinfoId])
        //更新表格数据
        dataSource[index] = { key: record.key, cellId: record.cellId }
        this.setState({ dataSource: dataSource });
    }

    /**
     * 保存
     */
    handleSave = () => {
        let _this = this;
        confirm({
            title: '确认保存？',
            okText: '确认',
            cancelText: '取消',
            onOk() {
                let { listDet, operator, dataSource } = _this.state;
                let { deleteData } = _this.params;
                let bookItems = [];
                dataSource.map(i => {//书籍项
                    if (i.bookName) {
                        bookItems = bookItems.concat({
                            bookcaseitemId: i.bookcaseitemId,
                            bsBookcellinfo: { cellId: i.cellId },
                            bookName: i.bookName,
                            rfid: i.rfid,
                            beLocation: { locationId: i.locationId },
                            bookId: i.bookId,
                        })
                    }
                })
                bookItems = bookItems.concat(deleteData);
                Req.putBookcaseRecords({
                    bookcaseId: listDet.bookcaseId,
                    status: "2",//状态：选书
                    type: "1",//调拨入柜单
                    user2: { uid: operator },
                    rsBookcaserecorditems: bookItems,
                }).then(result => {
                    if (result) {
                        message.success("更新成功 " + JSON.stringify(result.data))
                        _this.clearSelectedKeys(_this.requestList);//刷新页面
                    }
                })
            }
        });
    }

    /**
     * 生成书单
     */
    handleGenerate = () => {
        if (this.getBookListLength() > this.params.emptyCells.length) {
            message.error("所选书籍数超过格子总数！");
            return;
        }
        //将bookList的多维数组转换成一维数组，依次插入dataSource中
        let { dataSource } = this.state;
        //删除无效格子项
        dataSource.splice(0, this.params.invalidNum);
        //清除原来所有的书籍
        for (let i = 0; i < dataSource.length; i++) {
            dataSource[i] = { key: dataSource[i].key, cellId: dataSource[i].cellId }
        }
        this.params.bookList.map((arr, i, bookList) => {
            let index = 0;
            for (let k = 0; k < i; k++) {
                index += bookList[k].length;
            }
            arr.map((book, j) => {
                Object.assign(dataSource[index + j], book)
            })
        })
        this.setState({ dataSource: dataSource, modal: false })
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

    render() {
        const { listDet, full, dataSource, total } = this.state;
        /**手动铺书columns配置 */
        const columns1 = [
            { title: '格子编号', dataIndex: 'cellId' },
            {
                title: '书名', dataIndex: 'bookName', render: (bn, record, index) =>
                    record.disabled ?
                        bn : <a onClick={() => {
                            this.params.currentIndex = index;
                            this.setState({ modal: true })
                        }}>
                            {bn ? bn : "选书"}
                        </a>
            },
            { title: '电子标签', dataIndex: 'rfid' },
            { title: '货位', dataIndex: 'locationId' },
            {
                title: '操作', dataIndex: 'action',
                render: (text, record, index) => (
                    record.bookName ?
                        <Popconfirm title="是否确定删除?" okText="删除" cancelText="取消" onConfirm={() => { this.params.currentIndex = index; this.handleDelBook1() }}>
                            <a style={record.disabled ? { color: "#f5222d" } : { color: "#1890ff" }}>删除</a></Popconfirm> : ""
                )
            }
        ];
        /**自动铺书columns配置 */
        const columns2 = [
            { title: '格子编号', dataIndex: 'cellId' },
            { title: '书名', dataIndex: 'bookName' },
            { title: '电子标签', dataIndex: 'rfid' },
            { title: '货位', dataIndex: 'locationId' },
            {
                title: '操作', dataIndex: 'action',
                render: (text, record, index) => (
                    record.bookName ?
                        <Popconfirm title="是否确定删除?" okText="删除" cancelText="取消" onConfirm={() => { this.params.currentIndex = index; this.handleDelBook2(record) }}>
                            <a style={record.disabled ? { color: "#f5222d" } : { color: "#1890ff" }}>删除</a></Popconfirm> : ""
                )
            }
        ];
        return (
            <div>
                <Card
                    title={<div>
                        <Button type="primary" onClick={this.handleSave}>保存</Button>
                        <Button type="primary" onClick={this.handleDel}>删除</Button>
                    </div>}
                >
                    <div style={{ textAlign: 'right' }}>
                        <Button type="primary" disabled>选书</Button>
                    </div>
                    <h1 style={{ display: 'block', textAlign: 'center', fontSize: '26px', weight: 'bolder' }}>配置调拨入柜单</h1>
                    <Row>
                        {
                            listBase.map(i => (
                                <Col key={i.name} span={6} style={{ lineHeight: "40px" }}>
                                    <span style={{ fontWeight: "bold" }}>{i.label}:</span>
                                    {
                                        i.name === "user2Name" ?
                                            <Select
                                                value={this.state.operator}
                                                style={{ width: "100px", marginLeft: 8 }}
                                                onChange={(value) => { this.setState({ operator: value }) }}
                                            >
                                                {getOptionList(this.state.optionList)}
                                            </Select> :
                                            <span style={{ paddingLeft: 8 }}>{listDet[i.name]}</span>
                                    }
                                </Col>
                            ))
                        }
                    </Row><br />
                    {listDet.way === "自动铺书" && <p style={{ textAlign: "left" }}><Button type="primary" onClick={() => { this.setState({ modal: true }) }}>生成书单</Button></p>}
                    <Table
                        className="allocateInCase-Table"
                        columns={listDet.way === "手动铺书" ? columns1 : columns2}
                        dataSource={dataSource}
                        pagination={{
                            showTotal: (total, range) => `第 ${range[0]} 条到第 ${range[1]} 条，共 ${total} 条`,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50']
                        }}
                        footer={() => `共计：${total}个空格，已完成${full}个格子补书`}
                        bordered
                    />
                    <div style={{ textAlign: "center" }}>
                        <Button style={{ marginRight: '50px' }} size="large" type="primary">去发货</Button>
                    </div>
                </Card>
                {
                    listDet.way === "手动铺书" ?
                        <SelectModal
                            type='radio'
                            visible={this.state.modal}
                            onClose={() => { this.setState({ modal: false }) }}
                            onSelectBook={this.handleSelectBook}//选中书籍
                            selectedKeys={this.state.selectedKeys}
                        /> :
                        <SelectModal
                            type='check'
                            visible={this.state.modal}
                            onClose={() => { this.setState({ modal: false }) }}
                            onSelectBook={this.handleCheckBooks}//选择书籍生成书单
                            selectedKeys={this.state.selectedKeys}
                            onGenerate={this.handleGenerate}
                        />
                }
            </div>
        )
    }

    // =====================================dao=======================================

    /**
     * 清空selectedkeys数组中的元素
     * @param {*} callback 回调函数
     */
    clearSelectedKeys = (callback) => {
        this.setState({ selectedKeys: [] }, callback)
    }

    /**
     * 向selectedkeys数组中删除元素
     * @param {*} keys Array
     */
    rmSelectedKeys = (keys) => {
        let selectedKeys = this.state.selectedKeys;
        keys.map(key => {
            let selectedKeysIndex = selectedKeys.indexOf(key);
            selectedKeysIndex > -1 && selectedKeys.splice(selectedKeysIndex, 1);
        })
        this.setState({ selectedKeys: selectedKeys },()=>{console.log(this.state.selectedKeys)});
    }

    /**
     * 向selectedkeys数组中增加元素
     * @param {*} keys Array
     * @param {*} index 添加元素的下标，默认在末尾添加
     */
    addSelectedKeys = (keys, index) => {
        if (!index) {
            this.setState({ selectedKeys: this.state.selectedKeys.concat(keys) })
        } else {
            let { selectedKeys } = this.state;
            selectedKeys.splice(index, 0, keys);
            this.setState({ selectedKeys: selectedKeys })
        }
    }

    /**
     * 查找数组中的元素，并返回他的位置
     * @param {*} key 查找的元素
     */
    indexOfSelectedKeys = (key) => {
        let { selectedKeys } = this.state;
        return selectedKeys.indexOf(key)
    }

    /**
     * 向bookList中增加元素
     * @param {*} book 书籍信息
     * @param {*} index 将book插入到bookList[index]数组末尾
     */
    addBookList = (book, index) => {
        let { bookList } = this.params;
        bookList[index].push(book);
    }

    /**
     * 向bookList中删除元素
     * @param {*} index 深度遍历时的序号，从0开始
     */
    rmBookList = (index) => {
        let { bookList } = this.params;
        bookList.forEach(arr => {
            if (index > -1 && index < arr.length) {
                arr.splice(index, 1);
            }
            index -= arr.length;
        })
    }

    /**
     * 通过index,查找BookList中元素
     * @param {*} index 深度遍历时的序号，从0开始
     */
    getBookinList = (index) => {
        let { bookList } = this.params;
        console.log("bookLIst", bookList)
        let i = 0;
        for (; i < bookList.length; i++) {
            if (index > -1 && index < bookList[i].length) {
                break;
            }
            index -= bookList[i].length;
        }
        console.log(bookList[i][index])
        return bookList[i][index]
    }

    /**
     * 获得bookList的元素总数
     */
    getBookListLength = () => {
        let { bookList } = this.params;
        let len = 0;
        bookList.map(arr => {
            len += arr.length
        })
        return len;
    }
}

export default SelectBook;

/**
 * ========================手动铺书===============================
 * 相对于自动铺书，无bookList
 * modal选中与取消选中，直接操作dataSource
 * ~~~~ dataSource的顺序 = 无效格子 + emptycells的顺序
 * ~~~~ dataSource的顺序 != selectedKeys的顺序
 */

/**
 * ========================自动铺书===============================
 * {selectedKeys, dataSource} = this.state;
 * {emptyCells, bookList, deleteData} = this.params;
 * ~~~~ dataSource的顺序 = 无效格子 + emptycells的顺序
 * ~~~~ selectedKeys的顺序 = bookList的顺序
 * ~~~~ bookList会覆盖dataSource
 * 初始显示已保存的表格信息：
 *      selectedKeys：填充书籍的bookInfoId
 *      dataSource：无效格子项排在前面，后面是空闲格子，并将有书籍项的格子进行填充
 *      emptyCells：所有空闲格子信息
 *      bookList：bookList[2]保存书籍信息
 *      deleteData：[]
 * modal点击复选框：
 *      选中：
 *          将书籍信息写入bookList对应的分类数组中
 *          添加bookinfoId到selectedKeys
 *          ===(保证selectedKeys的顺序与bookList一致)===
 *      取消选中：
 *          selectedKeys删除对应的bookinfoId
 *          bookList删除对应的书籍信息
 *          是原来的保存项？ && 写入deleteData
 * 生成书单：
 *      dataSource删除无效格子项
 *      bookList依次填充emptyCells,其结果覆盖dataSource
 * 保存：
 *      dataSource + deleteData
 */
