import React from "react";
import { NavLink } from "react-router-dom";
import { Nav } from "reactstrap";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";

var ps;

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.activeRoute.bind(this);
  }
  // verifies if routeName is the one active (in browser input)
  activeRoute(routeName) {
    return (routeName == '/') ? (this.props.location.pathname == '/' ? 'active':''):(this.props.location.pathname.indexOf(routeName) > -1 ? 'active':'');
  }
  componentDidMount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps = new PerfectScrollbar(this.refs.sidebar, {
        suppressScrollX: true,
        suppressScrollY: false
      });
    }
  }
  componentWillUnmount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps.destroy();
    }
  }
  render() {
    return (
      <div className="sidebar" data-color="blue">
        <div className="logo logo-sidebar">
          <a
            href="/"
            className="simple-text logo-normal"
          >
            TELEPARSER
          </a>
        </div>
        <div className="sidebar-wrapper" ref="sidebar">
          <Nav>
          <li
              className={
                this.activeRoute("/global/")
              }
              key="global"
            >
              <NavLink
                to={"/global/"}
                className="nav-link"
                activeClassName="active"
              >
                <i className={"now-ui-icons ui-1_settings-gear-63"} />
                <p>Configuration</p>
              </NavLink>
            </li>
            <li
              className={
                this.activeRoute("/accounts/")
              }
              key="accounts"
            >
              <NavLink
                to={"/accounts/"}
                className="nav-link"
                activeClassName="active"
              >
                <i className={"now-ui-icons users_single-02"} />
                <p>Accounts</p>
              </NavLink>
            </li>
            <li
              className={
                this.activeRoute("/channels/") || this.activeRoute("/") || this.activeRoute("/messages/")
              }
              key="channels"
            >
              <NavLink
                to={"/channels/"}
                className="nav-link"
                activeClassName="active"
              >
                <i className={"now-ui-icons ui-1_simple-add"} />
                <p>Channels</p>
              </NavLink>
            </li>
            <li
              className={
                this.activeRoute("/feeds/")
              }
              key="feeds"
            >
              <NavLink
                to={"/feeds/"}
                className="nav-link"
                activeClassName="active"
              >
                <i className={"now-ui-icons objects_spaceship"} />
                <p>Feeds</p>
              </NavLink>
            </li>
          </Nav>
        </div>
      </div>
    );
  }
}

export default Sidebar;
