import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { ConfigureStore } from './redux/';

import "bootstrap/dist/css/bootstrap.css";
import "./assets/scss/now-ui-dashboard.css";
import "./assets/css/demo.css";

import Dashboard from "./layouts/Dashboard/Dashboard";

const store = ConfigureStore();

ReactDOM.render(
  <Provider store={store} >
    <BrowserRouter>
      <Route path="/" component={Dashboard} />
    </BrowserRouter>
  </Provider>,
  document.getElementById("root")
);
