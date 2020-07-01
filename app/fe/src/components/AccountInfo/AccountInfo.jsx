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
    Input
} from "reactstrap"

import { withRouter } from "react-router-dom";
import { connect } from 'react-redux';
import { fetchAccounts, toggleAccounts, updateAccount, deleteAccount } from '../../redux/ActionCreators';

// redux store
const mapStateToProps = state => {
    return {
        accounts: state.accounts,
    }
}

const mapDispatchToProps = dispatch => ({
    fetchAccounts: () => {
        dispatch(fetchAccounts())
    },
    toggleAccounts: (type, val, id) => {
        dispatch(toggleAccounts(type, val, id))
    },
    updateAccounts: (id, source, username, password, user_id, feeds) => {
        dispatch(updateAccount(id, source, username, password, user_id, feeds))
    },
    deleteAccount: (id) => {
        dispatch(deleteAccount(id))
    }
});

class AccountInfo extends React.Component {

    constructor(props){
        super(props)

        this.toggleAccountDialog = this.toggleAccountDialog.bind(this);
        this.submitAccountHandler = this.submitAccountHandler.bind(this);
        this.confirmAccountDelete = this.confirmAccountDelete.bind(this);
    }

    componentDidMount() {
        this.props.fetchAccounts();
    }

    confirmAccountDelete(e, id, label) {
        if (window.confirm('Удалить аккаунт ' + label + '?'))
            this.props.deleteAccount(id)
    }

    toggleAccountDialog(e, id) {
        this.props.toggleAccounts("accounts", !this.props.accounts.modals.accounts, id)
    }

    submitAccountHandler() {
        let arr = this.formAccountFeeds.value.split(',')
        let feeds = arr.map((e) => { return e.trim()})
        
        this.props.updateAccounts(this.formAccountId.value, this.formAccountSource.value, this.formAccountUsername.value, this.formAccountPassword.value, this.formAccountUid.value, feeds)
        this.toggleAccountDialog(null, 0)
    }

    render() {
        const platforms = {'tg': 'Телеграм', 'ig': 'Инстаграм', 'vk': 'ВК'}
        const accountList = (this.props.accounts.data.accounts) ? this.props.accounts.data.accounts.map((item) => {
            return (
              <tr key={item.id}>
                    <td>
                        {platforms[item.source]}
                    </td>
                    <td>
                        {item.username}
                    </td>
                    <td>
                        {item.feeds.join(', ')}
                    </td>
                    <td>
                        <Button onClick={(e) => this.toggleAccountDialog(e, item.id)}>Редактировать</Button>
                        {' '}
                        <Button onClick={(e) => this.confirmAccountDelete(e, item.id, item.username + ' [' + platforms[item.source] + ']')} color="danger">Удалить</Button>
                    </td>
              </tr>
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
                                <Button color="info" className="float-right" onClick={(e) => this.toggleAccountDialog(e, 0)}>Добавить акаунт</Button>
                                <CardTitle tag="h6">Аккаунты</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table bordered>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>Платформа</th>
                                            <th>Логин</th>
                                            <th>Источники</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>{accountList}</tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Modal isOpen={this.props.accounts.modals.accounts} toggle={this.toggleAccountDialog}>
                    <ModalHeader toggle={this.toggleAccountDialog}>Управление аккаунтом</ModalHeader>
                    <ModalBody>
                        <Form>
                            <Input type="hidden" name="id" value={(this.props.accounts.active.accounts) ? this.props.accounts.active.accounts.id:0} innerRef={node => (this.formAccountId = node)} id="formAccountId" />
                            <FormGroup>
                                <Label for="formAccountSource">Платформа</Label>
                                <Input type="select" name="source" defaultValue={(this.props.accounts.active.accounts) ? this.props.accounts.active.accounts.source:''} innerRef={node => (this.formAccountSource = node)} id="formAccountSource">
                                    <option value="tg">Телеграм</option>
                                    <option value="ig">Инстаграм</option>
                                    <option value="vk">ВК</option>
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="formAccountUsername">Логин</Label>
                                <Input type="text" name="url" defaultValue={(this.props.accounts.active.accounts) ? this.props.accounts.active.accounts.username:''} innerRef={node => (this.formAccountUsername = node)} id="formAccountUsername" placeholder="" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formAccountPassword">Пароль</Label>
                                <Input type="text" name="url" defaultValue='' innerRef={node => (this.formAccountPassword = node)} id="formAccountPassword" placeholder="********" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formAccountUid">Идентификатор</Label>
                                <Input type="text" name="url" defaultValue={(this.props.accounts.active.accounts) ? this.props.accounts.active.accounts.user_id:''} innerRef={node => (this.formAccountUid = node)} id="formAccountUid" placeholder="" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formAccountFeeds">Источники</Label>
                                <Input type="textarea" name="url" defaultValue={(this.props.accounts.active.accounts) ? this.props.accounts.active.accounts.feeds.join(', '):''} innerRef={node => (this.formAccountFeeds = node)} id="formAccountFeeds" placeholder="через запятую" />
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.submitAccountHandler}>Сохранить</Button>{' '}
                        <Button color="secondary" onClick={this.toggleAccountDialog}>Отмена</Button>
                    </ModalFooter>
                </Modal>
            </div>
            </>
        )
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AccountInfo));