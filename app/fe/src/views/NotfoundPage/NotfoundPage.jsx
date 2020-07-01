import React from "react";
import { Row, Col } from "reactstrap";

import { PanelHeader } from "../../components";

class NotFound extends React.Component {
  render() {
    return (
      <div>
        <PanelHeader size="sm" />
        <div className="content">
          <Row>
            <Col className="col-md-12 text-center">
                <img src="/404.png" alt="404 image" />
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

export default NotFound;
