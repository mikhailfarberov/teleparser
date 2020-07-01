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
    Modal, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    Form,
    FormGroup,
    Label,
    Input,
    CustomInput
} from "reactstrap"

import { withRouter } from "react-router-dom";
import { connect } from 'react-redux';
import { fetchFeeds, toggleFeeds, updateFeed, deleteFeed, fetchGlobal, fetchChannels } from '../../redux/ActionCreators';

// redux store
const mapStateToProps = state => {
    return {
        feeds: state.feeds,
        channels: state.channels,
        global: state.global
    }
}

const mapDispatchToProps = dispatch => ({
    fetchFeeds: () => {
        dispatch(fetchFeeds())
    },
    fetchGlobal: () => {
        dispatch(fetchGlobal())
    },
    fetchChannels: () => {
        dispatch(fetchChannels())
    },
    toggleFeeds: (type, val, id) => {
        dispatch(toggleFeeds(type, val, id))
    },
    updateFeed: (id, params, envs, channels) => {
        dispatch(updateFeed(id, params, envs, channels))
    },
    deleteFeed: (id) => {
        dispatch(deleteFeed(id))
    }
});

class FeedInfo extends React.Component {

    constructor(props){
        super(props)

        this.toggleFeedDialog = this.toggleFeedDialog.bind(this);
        this.submitFeedHandler = this.submitFeedHandler.bind(this);
        this.confirmFeedDelete = this.confirmFeedDelete.bind(this);
    }

    componentDidMount() {
        this.props.fetchFeeds();
        this.props.fetchGlobal();
        this.props.fetchChannels();
    }

    confirmFeedDelete(e, id, label) {
        if (window.confirm('Удалить канал ' + label + '?'))
            this.props.deleteFeed(id)
    }

    toggleFeedDialog(e, id) {
        this.props.toggleFeeds("feeds", !this.props.feeds.modals.feeds, id)
    }

    submitFeedHandler() {
        let envs = []
        for (let i = 0, l = this.formFeedEnvs.options.length; i < l; i++) {
            if (this.formFeedEnvs.options[i].selected) {
              envs.push(this.formFeedEnvs.options[i].value);
            }
        }
        let channels = []
        for (let i = 0, l = this.formFeedChannels.options.length; i < l; i++) {
            if (this.formFeedChannels.options[i].selected) {
              channels.push(this.formFeedChannels.options[i].value);
            }
        }
        this.props.updateFeed(this.formFeedId.value, 
            {
                'name': this.formFeedName.value, 
                'desc': this.formFeedDesc.value, 
                'username': this.formFeedUsername.value, 
                'sync': (this.formFeedSync.checked) ? 1:0, 
                'publish_mode': this.formFeedPublishMode.value, 
                'time_from': parseInt(this.formFeedTimeFrom.value), 
                'time_to': parseInt(this.formFeedTimeTo.value), 
                'interval_from': parseInt(this.formFeedIntervalFrom.value), 
                'interval_to': parseInt(this.formFeedIntervalTo.value)
            }, 
            envs, 
            channels
        )
        this.toggleFeedDialog(null, 0)
    }

    render() {
        const platforms = {'tg': 'Телеграм', 'ig': 'Инстаграм', 'vk': 'ВК'}
        const modes = {'manual': 'Вручную', 'auto': 'Автоматически', 'timetable': 'По расписанию'}

        const feedList = (this.props.feeds.data.feeds) ? this.props.feeds.data.feeds.map((item) => {
            return (
                <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.username}</td>
                    <td>{modes[item.publish_mode]}</td>
                    <td>{(item.sync) ? 'Публикуется':'Остановлено'}</td>
                    <td>
                        <Button onClick={(e) => this.toggleFeedDialog(e, item.id)}>Редактировать</Button>
                        {' '}
                        <Button onClick={(e) => this.confirmFeedDelete(e, item.id, item.name)} color="danger">Удалить</Button>
                    </td>
                </tr>
            );
          }):'';

        const envList = (this.props.global.data.envs) ? this.props.global.data.envs.map((item) => {
            return (
              <option value={item.id}>{item.url}</option>
            );
          }):'';

        const channelList = (this.props.channels.data.channels) ? this.props.channels.data.channels.map((item) => {
        return (
            <option value={item.id}>{item.name} [{platforms[item.source]}]</option>
        );
        }):'';

        return (
            <>
            <br></br>
            <div className="content">
                <Row>
                    <Col xs={12}>
                        <Card>
                            <CardHeader>
                                <Button color="info" className="float-right" onClick={(e) => this.toggleFeedDialog(e, 0)}>Добавить канал</Button>
                                <CardTitle tag="h6">Каналы</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table bordered>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>Название</th>
                                            <th>Пользователь</th>
                                            <th>Режим публикации</th>
                                            <th>Статус</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>{feedList}</tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Modal isOpen={this.props.feeds.modals.feeds} toggle={this.toggleFeedDialog}>
                    <ModalHeader toggle={this.toggleFeedDialog}>Управление каналом</ModalHeader>
                    <ModalBody>
                        <Form>
                            <Input type="hidden" name="id" value={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.id:0} innerRef={node => (this.formFeedId = node)} id="formFeedId" />
                            <FormGroup>
                                <Label for="formFeedName">Название</Label>
                                <Input type="text" name="name" defaultValue={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.name:''} innerRef={node => (this.formFeedName = node)} id="formFeedName" placeholder="" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formFeedName">Описание</Label>
                                <Input type="textarea" name="desc" defaultValue={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.desc:''} innerRef={node => (this.formFeedDesc = node)} id="formFeedDesc" placeholder="" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formFeedName">Пользователь</Label>
                                <Input type="text" name="username" defaultValue={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.username:''} innerRef={node => (this.formFeedUsername = node)} id="formFeedUsername" placeholder="" />
                            </FormGroup>
                            <FormGroup>
                                <CustomInput type="switch" defaultChecked={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.sync:1} id="formFeedSync" name="sync" innerRef={node => (this.formFeedSync = node)} label="Публиковать" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formFeedPublishMode">Режим публикации</Label>
                                <Input type="select" name="publish_mode" defaultValue={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.publish_mode:''} innerRef={node => (this.formFeedPublishMode = node)} id="formFeedPublishMode" placeholder="">
                                    <option value="manual">Ручной</option>
                                    <option value="auto">Авто</option>
                                    <option value="timetable">Расписание</option>
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="formFeedTimeFrom">Период публикации</Label>
                                <Row>
                                    <Col sm={3}>
                                        <Input type="number" size={2} name="time_from" defaultValue={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.time_from:''} innerRef={node => (this.formFeedTimeFrom = node)} id="formFeedTimeFrom" placeholder="чч" />
                                    </Col>
                                    {' - '}
                                    <Col sm={3}>
                                        <Input type="number" size={2} name="time_to" defaultValue={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.time_to:''} innerRef={node => (this.formFeedTimeTo = node)} id="formFeedTimeTo" placeholder="чч" />
                                    </Col>
                                </Row>
                            </FormGroup>
                            <FormGroup>
                                <Label for="formFeedIntervalFrom">Частота публикации</Label>
                                <Row>
                                    <Col sm={3}>
                                        <Input type="text" size={2} name="interval_from" defaultValue={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.interval_from:''} innerRef={node => (this.formFeedIntervalFrom = node)} id="formFeedTimeFrom" placeholder="чч" />
                                    </Col>
                                    {' - '}
                                    <Col sm={3}>
                                        <Input type="text" size={2} name="interval_to" defaultValue={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.interval_to:''} innerRef={node => (this.formFeedIntervalTo = node)} id="formFeedIntervalTo" placeholder="чч" />
                                    </Col>
                                </Row>
                            </FormGroup>
                            <FormGroup>
                                <Label for="formFeedEnvs">Сервера Sendy</Label>
                                <Input type="select" name="envs" defaultValue={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.envs:[]} innerRef={node => (this.formFeedEnvs = node)} id="formFeedEnvs" placeholder="" multiple>
                                    {envList}
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="formFeedEnvs">Источники</Label>
                                <Input type="select" name="channels" defaultValue={(this.props.feeds.active.feeds) ? this.props.feeds.active.feeds.channels:[]} innerRef={node => (this.formFeedChannels = node)} id="formFeedChannels" placeholder="" multiple>
                                    {channelList}
                                </Input>
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.submitFeedHandler}>Сохранить</Button>{' '}
                        <Button color="secondary" onClick={this.toggleFeedDialog}>Отмена</Button>
                    </ModalFooter>
                </Modal>
            </div>
            </>
        )
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(FeedInfo));