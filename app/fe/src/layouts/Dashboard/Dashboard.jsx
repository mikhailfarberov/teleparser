import React from "react";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";
import { Route, Switch } from "react-router-dom";

import { Header, Footer, Sidebar, ChannelInfo, FeedInfo, GlobalInfo, AccountInfo, MessagesInfo } from "../../components";

var ps;

class Dashboard extends React.Component {
  componentDidMount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps = new PerfectScrollbar(this.refs.mainPanel);
      document.body.classList.toggle("perfect-scrollbar-on");
    }
  }
  componentWillUnmount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps.destroy();
      document.body.classList.toggle("perfect-scrollbar-on");
    }
  }
  componentDidUpdate(e) {
    if (e.history.action === "PUSH") {
      this.refs.mainPanel.scrollTop = 0;
      document.scrollingElement.scrollTop = 0;
    }
  }
  render() {
    return (
      <div className="wrapper">
        <Sidebar {...this.props} />
        <div className="main-panel" ref="mainPanel">
          <Header {...this.props} />
          <Switch>
            <Route path="/channels/" component={ChannelInfo} key="channels" />
            <Route path="/feeds/" component={FeedInfo} key="feeds" />
            <Route path="/global/" component={GlobalInfo} key="global" />
            <Route path="/accounts/" component={AccountInfo} key="accounts" />
            <Route path="/messages/:channelId" component={MessagesInfo} key="messages" />
            <Route path="/" component={ChannelInfo} key="default" />
          </Switch>
          <Footer fluid />
        </div>
      </div>
    );
  }
}

export default Dashboard;