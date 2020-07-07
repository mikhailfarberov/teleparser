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
import { fetchGlobal, toggleGlobal, updateGlobal, deleteGlobal } from '../../redux/ActionCreators';

// redux store
const mapStateToProps = state => {
    return {
        global: state.global,
    }
}

const mapDispatchToProps = dispatch => ({
    fetchGlobal: () => {
        dispatch(fetchGlobal())
    },
    toggleGlobal: (type, val, id) => {
        dispatch(toggleGlobal(type, val, id))
    },
    updateGlobal: (data) => {
        dispatch(updateGlobal(data))
    },
    deleteGlobal: (data) => {
        dispatch(deleteGlobal(data))
    }
});

class GlobalInfo extends React.Component {

    constructor(props){
        super(props)

        this.toggleEnvDialog = this.toggleEnvDialog.bind(this);
        this.toggleDropsDialog = this.toggleDropsDialog.bind(this);
        this.toggleReplacementsDialog = this.toggleReplacementsDialog.bind(this);
        this.toggleWhitelistDialog = this.toggleWhitelistDialog.bind(this);
        this.submitEnvsHandler = this.submitEnvsHandler.bind(this);
        this.submitDropsHandler = this.submitDropsHandler.bind(this);
        this.submitReplacementsHandler = this.submitReplacementsHandler.bind(this);
        this.submitWhitelistHandler = this.submitWhitelistHandler.bind(this);
        this.confirmEnvsDelete = this.confirmEnvsDelete.bind(this);
        this.confirmDropsDelete = this.confirmDropsDelete.bind(this);
        this.confirmReplacementsDelete = this.confirmReplacementsDelete.bind(this);
        this.confirmWhitelistDelete = this.confirmWhitelistDelete.bind(this);

    }

    componentDidMount() {
        this.props.fetchGlobal();
    }

    confirmEnvsDelete(e, id, label) {
        if (window.confirm('Do you wanna delete endpoint ' + label + '?'))
            this.props.deleteGlobal({"envs": [{'id': id}]})
    }

    confirmDropsDelete(e, id, label) {
        if (window.confirm('Do you wanna delete filter ' + label + '?'))
            this.props.deleteGlobal({"drops": [{'id': id}]})
    }

    confirmReplacementsDelete(e, id, label) {
        if (window.confirm('Do you wanna delete replacement ' + label + '?'))
            this.props.deleteGlobal({"replacements": [{'id': id}]})
    }

    confirmWhitelistDelete(e, id, label) {
        if (window.confirm('Do you wanna delete link ' + label + '?'))
            this.props.deleteGlobal({"whitelist": [{'id': id}]})
    }

    toggleEnvDialog(e, id) {
        this.props.toggleGlobal("envs", !this.props.global.modals.envs, id)
    }

    submitEnvsHandler() {
        this.props.updateGlobal({"envs": [{'id': this.formEnvsId.value, 'url': this.formEnvsUrl.value}]})
        this.toggleEnvDialog(null, 0)
    }

    submitDropsHandler() {
        this.props.updateGlobal({"drops": [{'id': this.formDropsId.value, 'expr': this.formDropsExpr.value}]})
        this.toggleDropsDialog(null, 0)
    }

    submitReplacementsHandler() {
        this.props.updateGlobal({"replacements": [{'id': this.formReplacementsId.value, 'expr_search': this.formReplacementsExprSearch.value, 'expr_replace': this.formReplacementsExprReplace.value}]})
        this.toggleReplacementsDialog(null, 0)
    }

    submitWhitelistHandler() {
        this.props.updateGlobal({"whitelist": [{'id': this.formWhitelistId.value, 'url': this.formWhitelistUrl.value}]})
        this.toggleWhitelistDialog(null, 0)
    }

    toggleDropsDialog(e, id) {
        this.props.toggleGlobal("drops", !this.props.global.modals.drops, id)
    }

    toggleReplacementsDialog(e, id) {
        this.props.toggleGlobal("replacements", !this.props.global.modals.replacements, id)
    }

    toggleWhitelistDialog(e, id) {
        this.props.toggleGlobal("whitelist", !this.props.global.modals.whitelist, id)
    }

    render() {
        const envsList = (this.props.global.data.envs) ? this.props.global.data.envs.map((item) => {
            return (
              <tr key={item.id}>
                    <td>
                        {item.url}
                    </td>
                    <td>
                        <ButtonGroup className="pull-right">
                            <Button onClick={(e) => this.toggleEnvDialog(e, item.id)}>Edit</Button>
                            {' '}
                            <Button onClick={(e) => this.confirmEnvsDelete(e, item.id, item.url)} color="danger">Delete</Button>
                        </ButtonGroup>
                    </td>
              </tr>
            );
          }):'';

        const dropsList = (this.props.global.data.drops) ? this.props.global.data.drops.map((item) => {
            return (
                <tr key={item.id}>
                    <td>
                        {item.expr}
                    </td>
                    <td>
                        <ButtonGroup className="pull-right">
                            <Button onClick={(e) => this.toggleDropsDialog(e, item.id)}>Edit</Button>
                            {' '}
                            <Button onClick={(e) => this.confirmDropsDelete(e, item.id, item.expr)} color="danger">Delete</Button>
                        </ButtonGroup>
                    </td>
                </tr>
            );
        }):'';

        const replacementsList = (this.props.global.data.replacements) ? this.props.global.data.replacements.map((item) => {
            return (
                <tr key={item.id}>
                    <td>
                        {item.expr_search}
                    </td>
                    <td>
                        {item.expr_replace}
                    </td>
                    <td>
                        <ButtonGroup className="pull-right">
                            <Button onClick={(e) => this.toggleReplacementsDialog(e, item.id)}>Edit</Button>
                            {' '}
                            <Button onClick={(e) => this.confirmReplacementsDelete(e, item.id, item.expr_search)} color="danger">Delete</Button>
                        </ButtonGroup>
                    </td>
                </tr>
            );
        }):'';

        const whitelistList = (this.props.global.data.whitelist) ? this.props.global.data.whitelist.map((item) => {
            return (
                <tr key={item.id}>
                    <td>
                        {item.url}
                    </td>
                    <td>
                        <ButtonGroup className="pull-right">
                            <Button onClick={(e) => this.toggleWhitelistDialog(e, item.id)}>Edit</Button>
                            {' '}
                            <Button onClick={(e) => this.confirmWhitelistDelete(e, item.id, item.url)} color="danger">Delete</Button>
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
                                <Button color="info" className="float-right" onClick={(e) => this.toggleEnvDialog(e, 0)}>Add</Button>
                                <CardTitle tag="h6">Publishing endpoints</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table bordered>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>Endpoint</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>{envsList}</tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12}>
                        <Card>
                            <CardHeader>
                                <Button color="info" className="float-right" onClick={(e) => this.toggleDropsDialog(e, 0)}>Add</Button>
                                <CardTitle tag="h6">Filters</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table bordered>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>Filter</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>{dropsList}</tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12}>
                        <Card>
                            <CardHeader>
                                <Button color="info" className="float-right" onClick={(e) => this.toggleReplacementsDialog(e, 0)}>Add</Button>
                                <CardTitle tag="h6">Replacements</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table bordered>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>Search</th>
                                            <th>Replace</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>{replacementsList}</tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12}>
                        <Card>
                            <CardHeader>
                                <Button color="info" className="float-right" onClick={(e) => this.toggleWhitelistDialog(e, 0)}>Add</Button>
                                <CardTitle tag="h6">White source</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table bordered>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>Link</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>{whitelistList}</tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Modal isOpen={this.props.global.modals.envs} toggle={this.toggleEnvDialog}>
                    <ModalHeader toggle={this.toggleEnvDialog}>Edit endpoint</ModalHeader>
                    <ModalBody>
                        <Form>
                            <Input type="hidden" name="id" value={(this.props.global.active.envs) ? this.props.global.active.envs.id:0} innerRef={node => (this.formEnvsId = node)} id="formEnvsId" />
                            <FormGroup>
                                <Label for="formEnvsUrl">URL</Label>
                                <Input type="text" name="url" defaultValue={(this.props.global.active.envs) ? this.props.global.active.envs.url:''} innerRef={node => (this.formEnvsUrl = node)} id="formEnvsUrl" placeholder="https://" />
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.submitEnvsHandler}>Save</Button>{' '}
                        <Button color="secondary" onClick={this.toggleEnvDialog}>Cancel</Button>
                    </ModalFooter>
                </Modal>
                <Modal isOpen={this.props.global.modals.drops} toggle={this.toggleDropsDialog}>
                    <ModalHeader toggle={this.toggleDropsDialog}>Edit filter</ModalHeader>
                    <ModalBody>
                        <Form>
                            <Input type="hidden" name="id" value={(this.props.global.active.drops) ? this.props.global.active.drops.id:0} innerRef={node => (this.formDropsId = node)} id="formDropsId" />
                            <FormGroup>
                                <Label for="formDropsExpr">Filter</Label>
                                <Input type="text" name="expr" defaultValue={(this.props.global.active.drops) ? this.props.global.active.drops.expr:''} innerRef={node => (this.formDropsExpr = node)} id="formDropsExpr" placeholder="*wildcard*" />
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.submitDropsHandler}>Save</Button>{' '}
                        <Button color="secondary" onClick={this.toggleDropsDialog}>Cancel</Button>
                    </ModalFooter>
                </Modal>
                <Modal isOpen={this.props.global.modals.replacements} toggle={this.toggleReplacementsDialog}>
                    <ModalHeader toggle={this.toggleReplacementsDialog}>Edit replacement</ModalHeader>
                    <ModalBody>
                        <Form>
                            <Input type="hidden" name="id" value={(this.props.global.active.replacements) ? this.props.global.active.replacements.id:0} innerRef={node => (this.formReplacementsId = node)} id="formReplacementsId" />
                            <FormGroup>
                                <Label for="formReplacementsExprSearch">Search</Label>
                                <Input type="text" name="expr_search" defaultValue={(this.props.global.active.replacements) ? this.props.global.active.replacements.expr_search:''} innerRef={node => (this.formReplacementsExprSearch = node)} id="formReplacementsExprSearch" placeholder="search" />
                            </FormGroup>
                            <FormGroup>
                                <Label for="formReplacementsExprReplace">Replacement</Label>
                                <Input type="text" name="expr_replace" defaultValue={(this.props.global.active.replacements) ? this.props.global.active.replacements.expr_replace:''} innerRef={node => (this.formReplacementsExprReplace = node)} id="formReplacementsExprReplace" placeholder="replace" />
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.submitReplacementsHandler}>Save</Button>{' '}
                        <Button color="secondary" onClick={this.toggleReplacementsDialog}>Cancel</Button>
                    </ModalFooter>
                </Modal>
                <Modal isOpen={this.props.global.modals.whitelist} toggle={this.toggleWhitelistDialog}>
                    <ModalHeader toggle={this.toggleWhitelistDialog}>Edit white list</ModalHeader>
                    <ModalBody>
                        <Form>
                            <Input type="hidden" name="id" value={(this.props.global.active.whitelist) ? this.props.global.active.whitelist.id:0} innerRef={node => (this.formWhitelistId = node)} id="formWhitelistId" />
                            <FormGroup>
                                <Label for="formWhitelistUrl">Url</Label>
                                <Input type="text" name="url" defaultValue={(this.props.global.active.whitelist) ? this.props.global.active.whitelist.url:''} innerRef={node => (this.formWhitelistUrl = node)} id="formWhitelistUrl" placeholder="https://" />
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.submitWhitelistHandler}>Save</Button>{' '}
                        <Button color="secondary" onClick={this.toggleWhitelistDialog}>Cancel</Button>
                    </ModalFooter>
                </Modal>
            </div>
            </>
        )
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GlobalInfo));