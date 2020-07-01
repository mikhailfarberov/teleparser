import React, { createRef } from "react";
import {
  Row,
  Col
} from "reactstrap";

import { PanelHeader, Stats, Tasks} from "../../components";

import BatchesCard from "../../components/MigrBatch/BatchesCard"
import CommonIncidentCard from "../../components/Incidents/CommonIncidentCard"
import MigrBatchDetailsCard from "../../components/MigrBatch/MigrBatchDetailsCard"
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

class Dashboard extends React.Component {

  constructor(props){
    super(props)
    
    this.state = {
      "viewBatches": []
    }

    this.handleClick = this.handleClick.bind(this)
    this.handleCloseClick = this.handleCloseClick.bind(this)
  }

  handleClick(e, batch) {
    console.log('ADD CARD', e, batch, this.state.viewBatches)
    this.setState(prevState => {
      prevState.viewBatches.push({"id": batch.id})
      return {"viewBatches": prevState.viewBatches}
    })
  }

  handleCloseClick(e, param){
    console.log('DEL CARD', param)
    this.setState(prevState => {      
      return {"viewBatches": prevState.viewBatches.filter(function(value, index, arr){
        return value.id !== param;
      })}
    })
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView(true);
  }

  componentDidUpdate(){
    this.scrollToBottom()
  }
   
  render() {    
    console.log('BATCHES', this.state.viewBatches)
    return (
      <div>
        <PanelHeader size="sm" />
        <div className="content">
          <Row>
            <Col xs={12}>
              <CommonIncidentCard/>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
               <BatchesCard mode = {0} handler = {this.handleClick}/>
            </Col>
          </Row>
          {
            this.state.viewBatches.map( i =>
              <ReactCSSTransitionGroup  key = {i.id} 
                                        transitionName="example"
                                        transitionAppear={true}
                                        transitionAppearTimeout={500}
                                        transitionEnter={false}
                                        transitionLeave={false}>
                <Row>
                  <Col xs={12}>
                    <MigrBatchDetailsCard batchId = {i.id} removeHandler={this.handleCloseClick}/>
                  </Col>
                </Row>
              </ReactCSSTransitionGroup>
            )
          }
        </div>
        <div style={{ float:"left", clear: "both" }}
             ref={(el) => { this.messagesEnd = el; }}>
        </div>
      </div>
    );
  }
}

export default Dashboard;
