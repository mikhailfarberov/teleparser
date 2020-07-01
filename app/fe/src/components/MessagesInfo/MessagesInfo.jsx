import React from "react"
import {
    Table,
    Card,
    CardHeader,
    CardTitle,
    CardBody,
    Row,
    Col,
    Button,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
    Container,
    Pagination,
    PaginationItem,
    PaginationLink
} from "reactstrap"
import classnames from 'classnames';
import moment from 'moment';
import { withRouter } from "react-router-dom";
import { connect } from 'react-redux';
import {
    fetchMessages,
    updateMessage,
    pageMessages,
    tabMessages
} from '../../redux/ActionCreators';

// redux store
const mapStateToProps = state => {
    return {
        messages: state.messages,
    }
}

const mapDispatchToProps = dispatch => ({
    fetchMessages: (channel_id, filter, offset, count) => {
        dispatch(fetchMessages(channel_id, filter, offset, count))
    },
    updateMessage: (channel_id, id, key, value, filter, offset, count) => {
        dispatch(updateMessage(channel_id, id, key, value, filter, offset, count))
    },
    pageMessages: (pageIndex) => {
        dispatch(pageMessages(pageIndex))
    },
    tabMessages: (tab) => {
        dispatch(tabMessages(tab))
    }
});

class MessagesInfo extends React.Component {

    constructor(props){
        super(props)

        this.handlePageClick = this.handlePageClick.bind(this);
        this.toggleTab = this.toggleTab.bind(this);
        this.setFiltered = this.setFiltered.bind(this);
        this.setManual = this.setManual.bind(this);
        this.setModerated = this.setModerated.bind(this);
    }

    componentDidMount() {
        this.props.fetchMessages(
            this.props.match.params.channelId,
            this.props.messages.activeTab,
            this.props.messages.pageIndex[this.props.messages.activeTab]*this.props.messages.pageSize,
            this.props.messages.pageSize
        );
    }

    setFiltered(id, val) {
        if (window.confirm((val) ? 'Отфильтровать выбранный пост?':'Вернуть выбранный пост к публикации?'))
            this.props.updateMessage(
                this.props.match.params.channelId,
                id,
                "filtered",
                val,
                this.props.messages.activeTab,
                this.props.messages.pageIndex[this.props.messages.activeTab]*this.props.messages.pageSize,
                this.props.messages.pageSize
            )
    }

    setManual(id) {
        if (window.confirm('Опубликовать выбранный пост в ручном режиме?'))
            this.props.updateMessage(
                this.props.match.params.channelId,
                id,
                "manual",
                1,
                this.props.messages.activeTab,
                this.props.messages.pageIndex[this.props.messages.activeTab]*this.props.messages.pageSize,
                this.props.messages.pageSize
            )
    }

    setModerated(id) {
        if (window.confirm('Разрешить публикацию выбранного поста?'))
            this.props.updateMessage(
                this.props.match.params.channelId,
                id,
                "moderated",
                1,
                this.props.messages.activeTab,
                this.props.messages.pageIndex[this.props.messages.activeTab]*this.props.messages.pageSize,
                this.props.messages.pageSize
            )
    }

    setPageIndex(index) {
        this.props.pageMessages(index)
        this.props.fetchMessages(
            this.props.match.params.channelId,
            this.props.messages.activeTab,
            index*this.props.messages.pageSize,
            this.props.messages.pageSize
        );
    }

    handlePageClick(i){
        let index = this.props.messages.pageIndex[this.props.messages.activeTab]
        switch(i) {
          case 'prev':
            this.setPageIndex((index > 0) ? (index-1):0)
            break
          case 'next':
            this.setPageIndex(index + 1)
            break
          default:
            this.setPageIndex(i)
        }
    }

    getCountPagesForView(countPages){
        return countPages < this.props.messages.pageCount ? countPages : this.props.messages.pageCount
    }

    toggleTab(tab) {
        this.props.tabMessages(tab)
        this.props.fetchMessages(
            this.props.match.params.channelId,
            tab,
            this.props.messages.pageIndex[this.props.messages.activeTab]*this.props.messages.pageSize,
            this.props.messages.pageSize
        );
    }

    messagesList(tab) {
        if (tab != this.props.messages.activeTab)
            return (<></>)

        const mediaList = (id, files) => {
            return files.map((file) => {
                return (<span>
                        <a href={"/downloads/" + this.props.match.params.channelId + "/" + id + "/" + file['filename']} target="_blank">
                            [{file['media_type']}]
                        </a>&nbsp;
                    </span>
                )
            })
        }
        const pubList = (publications) => {
            return publications.map((pub) => {
                return (<span>
                        {pub.name}: {moment.unix(pub.published).format("DD.MM.YYYY HH:mm")}&nbsp;
                        {(pub.error) ? `(${pub.error})&nbsp;`:''}
                    </span>
                )
            })
        }
        return this.props.messages.data.messages.map((msg) => {
            return (
                <tr>
                    <td>
                        {moment.unix(msg.created).format("DD.MM.YYYY HH:mm")}
                    </td>
                    <td>
                        <div dangerouslySetInnerHTML={{ __html: msg.txt }} />
                        {(msg.txt_origin) ? (<><br /><b>Исходный текст: </b><code>{msg.txt_origin}</code></>):''}
                    </td>
                    <td>
                        {mediaList(msg.id, msg.files)}
                    </td>
                    <td>
                        {pubList(msg.publications)}
                    </td>
                    <td>
                        {(tab == "new") ? (<><Button onClick={(e) => this.setManual(msg.id)}>Опубликовать</Button>{' '}<Button color="danger" onClick={(e) => this.setFiltered(msg.id, 1)}>Фильтровать</Button></>):''}
                        {(tab == "moderated") ? (<Button color="success" onClick={(e) => this.setModerated(msg.id)}>Разрешить</Button>):''}
                        {(tab == "filtered") ? (<Button color="success" onClick={(e) => this.setFiltered(msg.id, 0)}>Вернуть</Button>):''}
                    </td>
                </tr>
            );
        })
    }

    tabContent(tab) {
        return (
            <TabPane tabId={tab}>
                <Row>
                    <Col sm="12">
                        <Table>
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Текст</th>
                                    <th>Вложения</th>
                                    <th>Публикации</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(this.props.messages.data.messages.length) ? this.messagesList(tab):(<tr><td colspan="5" className="centered">нет записей</td></tr>)}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
                <hr />
                <Pagination className="pull-right" aria-label="Page navigation example">
                    <PaginationItem disabled={this.props.messages.pageIndex[tab] <= 0} className={"paginationItemStyle"}>
                        <PaginationLink onClick={e => this.handlePageClick('prev')} previous href="#"/>
                    </PaginationItem>
                    {
                        [...Array(this.getCountPagesForView(this.props.messages.pageIndex[tab] + 1))].map((page, i) =>
                            <PaginationItem active={i === this.props.messages.pageIndex[tab]}
                                            key = {i}
                                            className={'paginationItemStyle'}>
                                <PaginationLink onClick={e => this.handlePageClick(i)}
                                                href="#">
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>)
                    }
                    <PaginationItem disabled={this.props.messages.data.messages.length < this.props.messages.pageSize} className={"paginationItemStyle"}>
                        <PaginationLink onClick={e => this.handlePageClick('next')} next href="#"/>
                    </PaginationItem>
                </Pagination>
            </TabPane>
        )
    }

    render() {
        const platforms = {'tg': 'телеграм', 'ig': 'инстаграм', 'vk': 'ВК'}

        if (this.props.messages.data.channel !== undefined)
            return (
                <Card>
                    <CardHeader>
                        <Container>
                            <CardTitle tag="h4">Посты {platforms[this.props.messages.data.channel.source]} {this.props.messages.data.channel.name}</CardTitle>
                        </Container>
                    </CardHeader>
                    <CardBody style={{"minHeight": 560}}>
                        <Nav tabs>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.props.messages.activeTab === 'new' })}
                                    onClick={() => { this.toggleTab('new'); }}
                                >
                                    Новые посты
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.props.messages.activeTab === 'moderated' })}
                                    onClick={() => { this.toggleTab('moderated'); }}
                                >
                                    Модерация
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.props.messages.activeTab === 'published' })}
                                    onClick={() => { this.toggleTab('published'); }}
                                >
                                    Опубликованные
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.props.messages.activeTab === 'filtered' })}
                                    onClick={() => { this.toggleTab('filtered'); }}
                                >
                                    Отфильтрованные
                                </NavLink>
                            </NavItem>
                        </Nav>
                        <TabContent activeTab={this.props.messages.activeTab}>
                            {this.tabContent("new")}
                            {this.tabContent("moderated")}
                            {this.tabContent("published")}
                            {this.tabContent("filtered")}
                        </TabContent>
                    </CardBody>
                </Card>
            )
        else {
            return (<></>)
        }
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MessagesInfo));
