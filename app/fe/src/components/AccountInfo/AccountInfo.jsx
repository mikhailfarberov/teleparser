import React from "react"
import { 
    Table, 
    Card,
    CardHeader,
    CardTitle,
    CardBody,
    Row,
    Col,
    ButtonGroup,
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
        if (window.confirm('Do you wanna delete account ' + label + '?'))
            this.props.deleteAccount(id)
    }

    toggleAccountDialog(e, id) {
        this.props.toggleAccounts("accounts", !this.props.accounts.modals.accounts, id)
    }

    submitAccountHandler() {
        let arr = this.formAccountFeeds.value.split(',')
        let feeds = arr.map((e) => { return e.trim()})
        
        this.props.updateAccounts(this.formAccountId.value, this.formAccountSource.value, this.formAccountUsername.value, this.formAccountPassword.value, 0, feeds)
        this.toggleAccountDialog(null, 0)
    }

    render() {
        const platforms = {'tg': 'Telegram', 'ig': 'Instagram', 'vk': 'VK'}
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
                        <ButtonGroup className="pull-right">
                            <Button onClick={(e) => this.toggleAccountDialog(e, item.id)}>Edit</Button>
                            {' '}
                            <Button onClick={(e) => this.confirmAccountDelete(e, item.id, item.username + ' [' + platforms[item.source] + ']')} color="danger">Delete</Button>
                        </ButtonGroup>
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
                                <Button color="info" className="float-right" onClick={(e) => this.toggleAccountDialog(e, 0)}>Add</Button>
                                <CardTitle tag="h6">Accounts</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table bordered>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>Source</th>
                                            <th>Login</th>
                                            <th>Channels</th>
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
                    <ModalHeader toggle={this.toggleAccountDialog}>Edit account</ModalHeader>
                    <ModalBody>
                        <Form>
                            <Input type="hidden" name="id" value={(this.props.accounts.active.accounts) ? this.props.accounts.active.accounts.id:0} innerRef={node => (this.formAccountId = node)} id="formAccountId" />
                            <FormGroup>
                                <Label for="formAccountSource">Source</Label>
                                <Input type="select" name="source" defaultValue={(this.props.accounts.active.accounts) ? this.props.accounts.active.accounts.source:''} innerRef={node => (this.formAccountSource = node)} id="formAccountSource">
                                    <option value="tg">Telegram</option>
                                    <option value="ig">Instagram</option>
                                    <option value="vk">VK</option>
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="formAccountUsername">Login</Label>
                                <Input type="text" name="url" defaultValue={(this.props.accounts.active.accounts) ? this.props.accounts.active.accounts.username:''} innerRef={node => (this.formAccountUsername = node)} id="formAccountUsername" placeholder="" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formAccountPassword">Password</Label>
                                <Input type="text" name="url" defaultValue='' innerRef={node => (this.formAccountPassword = node)} id="formAccountPassword" placeholder="********" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formAccountFeeds">Channels</Label>
                                <Input type="textarea" name="url" defaultValue={(this.props.accounts.active.accounts) ? this.props.accounts.active.accounts.feeds.join(', '):''} innerRef={node => (this.formAccountFeeds = node)} id="formAccountFeeds" placeholder="delimited by comma" />
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.submitAccountHandler}>Save</Button>{' '}
                        <Button color="secondary" onClick={this.toggleAccountDialog}>Cancel</Button>
                    </ModalFooter>
                </Modal>
            </div>
            </>
        )
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AccountInfo));