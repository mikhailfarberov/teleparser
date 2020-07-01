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
import { 
    fetchChannels, 
    updateChannel, 
    toggleChannels,
    addChannelDrops,
    addChannelReplacements,
    addChannelWhitelist,
    removeChannelDrops,
    removeChannelReplacements,
    removeChannelWhitelist,
    editChannelDrops,
    editChannelReplacements,
    editChannelWhitelist
} from '../../redux/ActionCreators';

// redux store
const mapStateToProps = state => {
    return {
        channels: state.channels,
    }
}

const mapDispatchToProps = dispatch => ({
    fetchChannels: () => {
        dispatch(fetchChannels())
    },
    updateChannel: (id, source, params, drops, replacements, whitelist) => {
        dispatch(updateChannel(id, source, params, drops, replacements, whitelist))
    },
    toggleChannels: (type, val, id) => {
        dispatch(toggleChannels(type, val, id))
    },
    addChannelDrops: () => {
        dispatch(addChannelDrops())
    },
    addChannelReplacements: () => {
        dispatch(addChannelReplacements())
    },
    addChannelWhitelist: () => {
        dispatch(addChannelWhitelist())
    },
    removeChannelDrops: (id) => {
        dispatch(removeChannelDrops(id))
    },
    removeChannelReplacements: (id) => {
        dispatch(removeChannelReplacements(id))
    },
    removeChannelWhitelist: (id) => {
        dispatch(removeChannelWhitelist(id))
    },
    editChannelDrops: (id, key, value) => {
        dispatch(editChannelDrops(id, key, value))
    },
    editChannelReplacements: (id, key, value) => {
        dispatch(editChannelReplacements(id, key, value))
    },
    editChannelWhitelist: (id, key, value) => {
        dispatch(editChannelWhitelist(id, key, value))
    },
});

class ChannelInfo extends React.Component {

    constructor(props){
        super(props)

        this.toggleChannelDialog = this.toggleChannelDialog.bind(this);
        this.submitChannelHandler = this.submitChannelHandler.bind(this);
        this.addChannelDrops = this.addChannelDrops.bind(this);
        this.addChannelReplacements = this.addChannelReplacements.bind(this);
        this.addChannelWhitelist = this.addChannelWhitelist.bind(this);
        this.removeChannelDrops = this.removeChannelDrops.bind(this);
        this.removeChannelReplacements = this.removeChannelReplacements.bind(this);
        this.removeChannelWhitelist = this.removeChannelWhitelist.bind(this);
        this.editChannelDrops = this.editChannelDrops.bind(this);
        this.editChannelReplacements = this.editChannelReplacements.bind(this);
        this.editChannelWhitelist = this.editChannelWhitelist.bind(this);
    }

    componentDidMount() {
        this.props.fetchChannels();
    }

    editChannelDrops(e, id, key) {
        this.props.editChannelDrops(id, key, e.target.value)
    }

    editChannelReplacements(e, id, key) {
        this.props.editChannelReplacements(id, key, e.target.value)
    }

    editChannelWhitelist(e, id, key) {
        this.props.editChannelWhitelist(id, key, e.target.value)
    }

    toggleChannelDialog(e, id) {
        this.props.toggleChannels("channels", !this.props.channels.modals.channels, id)
    }

    addChannelDrops(e) {
        e.preventDefault()
        this.props.addChannelDrops();
    }

    addChannelReplacements() {
        this.props.addChannelReplacements();
    }

    addChannelWhitelist() {
        this.props.addChannelWhitelist();
    }

    removeChannelDrops(id) {
        this.props.removeChannelDrops(id);
    }

    removeChannelReplacements(id) {
        this.props.removeChannelReplacements(id);
    }

    removeChannelWhitelist(id) {
        this.props.removeChannelWhitelist(id);
    }

    submitChannelHandler() {
        let drops = []
        for (let i = 0, l = this.props.channels.active.channels.drops.length; i < l; i++) {
            if (this.props.channels.active.channels.drops[i].expr != '') {
              drops.push(this.props.channels.active.channels.drops[i])
            }
        }
        let replacements = []
        for (let i = 0, l = this.props.channels.active.channels.replacements.length; i < l; i++) {
            if (this.props.channels.active.channels.replacements[i].expr_search != '') {
              replacements.push(this.props.channels.active.channels.replacements[i])
            }
        }
        let whitelist = []
        for (let i = 0, l = this.props.channels.active.channels.whitelist.length; i < l; i++) {
            if (this.props.channels.active.channels.whitelist[i].url != '') {
              whitelist.push(this.props.channels.active.channels.whitelist[i])
            }
        }
        
        this.props.updateChannel(this.formChannelId.value, this.formChannelSource.value,
            {
                'moderation': (this.formChannelModeration.checked) ? 1:0, 
                'cmt': this.formChannelCmt.value,
                'watermark_used': (this.formChannelWatermarkUsed.checked) ? 1:0, 
                'watermark_orient': this.formChannelWatermarkOrient.value,
                'watermark_height': this.formChannelWatermarkHeight.value,
                'watermark_width': this.formChannelWatermarkWidth.value,
                'watermark_method': this.formChannelWatermarkMethod.value,
            }, 
            drops, 
            replacements,
            whitelist
        )
        this.toggleChannelDialog(null, 0)
    }

    render() {
        const platforms = {'tg': 'Телеграм', 'ig': 'Инстаграм', 'vk': 'ВК'}
        const channelList = (this.props.channels.data.channels) ? this.props.channels.data.channels.map((item) => {
            return (
                <tr key={item.id}>
                    <td>{platforms[item.source]}</td>
                    <td>{item.name}</td>
                    <td>{(item.moderation) ? 'Модерация':'Без модерации'}</td>
                    <td>
                        <Button onClick={(e) => this.toggleChannelDialog(e, item.id)}>Редактировать</Button>
                        {' '}
                        <Button href={"/messages/"+item.id} color="info" >Посты</Button>
                    </td>
                    <td>{item.cmt}</td>
                </tr>
            );
        }):'';

        const dropsList = (this.props.channels.active.channels) ? this.props.channels.active.channels.drops.map((item) => {
            return (
                    <Row>
                        <Col sm={10}>
                            <Input defaultValue={item.expr} placeholder="*поиск*" onChange={(e) => {this.editChannelDrops(e, item.id, 'expr')}} />
                        </Col>
                        <Col sm={2}>
                            <Button size="sm" color="danger" onClick={(e) => {this.removeChannelDrops(item.id)}}><i className={"now-ui-icons ui-1_simple-remove"} /></Button>
                        </Col>
                    </Row>
            )
        }):''
        const replacementsList = (this.props.channels.active.channels) ? this.props.channels.active.channels.replacements.map((item) => {
            return (
                    <Row>
                        <Col sm={5}>
                            <Input defaultValue={item.expr_search} placeholder="Что ищем" onChange={(e) => {this.editChannelReplacements(e, item.id, 'expr_search')}} />
                        </Col>
                        {' '}
                        <Col sm={5}>
                            <Input defaultValue={item.expr_replace} placeholder="На что заменяем" onChange={(e) => {this.editChannelReplacements(e, item.id, 'expr_replace')}} />
                        </Col>
                        <Col sm={2}>
                            <Button size="sm" color="danger" onClick={(e) => {this.removeChannelReplacements(item.id)}}><i className={"now-ui-icons ui-1_simple-remove"} /></Button>
                        </Col>
                    </Row>
            )
        }):''
        const whitelistList = (this.props.channels.active.channels) ? this.props.channels.active.channels.whitelist.map((item) => {
            return (
                    <Row>
                        <Col sm={10}>
                            <Input defaultValue={item.url} placeholder="ссылка" onChange={(e) => {this.editChannelWhitelist(e, item.id, 'url')}} />
                        </Col>
                        <Col sm={2}>
                            <Button size="sm" color="danger" onClick={(e) => {this.removeChannelWhitelist(item.id)}}><i className={"now-ui-icons ui-1_simple-remove"} /></Button>
                        </Col>
                    </Row>
            )
        }):''

        return (
            <>
            <br></br>
            <div className="content">
                <Row>
                    <Col xs={12}>
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h6">Источники</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table bordered>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>Платформа</th>
                                            <th>Название</th>
                                            <th>Модерация</th>
                                            <th>Комментарий</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>{channelList}</tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Modal isOpen={this.props.channels.modals.channels} toggle={this.toggleChannelDialog}>
                    <ModalHeader toggle={this.toggleChannelDialog}>Управление источником</ModalHeader>
                    <ModalBody>
                        <Form>
                            <Input type="hidden" name="id" value={(this.props.channels.active.channels) ? this.props.channels.active.channels.id:0} innerRef={node => (this.formChannelId = node)} id="formChannelId" />
                            <Input type="hidden" name="source" value={(this.props.channels.active.channels) ? this.props.channels.active.channels.source:''} innerRef={node => (this.formChannelSource = node)} id="formChannelSource" />
                            <FormGroup>
                                <CustomInput type="switch" defaultChecked={(this.props.channels.active.channels) ? this.props.channels.active.channels.moderation:1} id="formChannelModeration" name="moderation" innerRef={node => (this.formChannelModeration = node)} label="Модерация" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formChannelCmt">Комментарий</Label>
                                <Input type="textarea" name="cmt" defaultValue={(this.props.channels.active.channels) ? this.props.channels.active.channels.cmt:''} innerRef={node => (this.formChannelCmt = node)} id="formChannelCmt" placeholder="" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formChannelDrops">Фильтры</Label>
                                {dropsList}
                                <Row>
                                    <Col sm={12}>
                                        <Button size="sm" color="info" onClick={this.addChannelDrops}><i className={"now-ui-icons ui-1_simple-add"} /></Button>
                                    </Col>
                                </Row>
                            </FormGroup>
                            <FormGroup>
                                <Label for="formChannelReplacements">Замены</Label>
                                {replacementsList}
                                <Row>
                                    <Col sm={12}>
                                        <Button size="sm" color="info" onClick={this.addChannelReplacements}><i className={"now-ui-icons ui-1_simple-add"} /></Button>
                                    </Col>
                                </Row>
                            </FormGroup>
                            <FormGroup>
                                <Label for="formChannelWhitelist">Белый список</Label>
                                {whitelistList}
                                <Row>
                                    <Col sm={12}>
                                        <Button size="sm" color="info" onClick={this.addChannelWhitelist}><i className={"now-ui-icons ui-1_simple-add"} /></Button>
                                    </Col>
                                </Row>
                            </FormGroup>
                            <FormGroup>
                                <CustomInput type="switch" defaultChecked={(this.props.channels.active.channels) ? this.props.channels.active.channels.watermark_used:0} id="formChannelWatermarkUsed" name="watermark_used" innerRef={node => (this.formChannelWatermarkUsed = node)} label="Watermark" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formChannelWatermarkOrient">Положение watermark</Label>
                                <Input type="select" name="watermark_orient" defaultValue={(this.props.channels.active.channels) ? this.props.channels.active.channels.watermark_orient:'center'} innerRef={node => (this.formChannelWatermarkOrient = node)} id="formChannelWatermarkOrient" placeholder="">
                                    <option value="center">Центр</option>
                                    <option value="top-left">Верх слева</option>
                                    <option value="top-right">Верх справа</option>
                                    <option value="bottom-left">Низ слева</option>
                                    <option value="bottom-right">Низ справа</option>
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="formChannelWidth">Размер watermark</Label>
                                <Row>
                                    <Col sm={3}>
                                        <Input type="number" size={2} name="watermark_width" defaultValue={(this.props.channels.active.channels) ? this.props.channels.active.channels.watermark_width:''} innerRef={node => (this.formChannelWatermarkWidth = node)} id="formChannelWatermarkWidth" placeholder="px" />
                                    </Col>
                                    {' x '}
                                    <Col sm={3}>
                                        <Input type="number" size={2} name="watermark_height" defaultValue={(this.props.channels.active.channels) ? this.props.channels.active.channels.watermark_height:''} innerRef={node => (this.formChannelWatermarkHeight = node)} id="formChannelWatermarkHeight" placeholder="px" />
                                    </Col>
                                </Row>
                            </FormGroup>
                            <FormGroup>
                                <Label for="formChannelWatermarkMethod">Метод удаления watermark</Label>
                                <Input type="select" name="watermark_method" defaultValue={(this.props.channels.active.channels) ? this.props.channels.active.channels.watermark_method:'blur'} innerRef={node => (this.formChannelWatermarkMethod = node)} id="formChannelWatermarkMethod" placeholder="">
                                    <option value="inpaint">Размытие</option>
                                    <option value="cut">Обрезка</option>
                                    <option value="scale">Масштабирование</option>
                                </Input>
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.submitChannelHandler}>Сохранить</Button>{' '}
                        <Button color="secondary" onClick={this.toggleChannelDialog}>Отмена</Button>
                    </ModalFooter>
                </Modal>
            </div>
            </>
        )
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ChannelInfo));