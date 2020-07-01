import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Channels } from './channels';
import { Messages } from './messages';
import { Accounts } from './accounts';
import { Feeds } from './feeds';
import { Global } from './global';
import thunk from 'redux-thunk';
import logger from 'redux-logger';

export const ConfigureStore = () => {
    const store = createStore(
        combineReducers({
            channels: Channels,
            messages: Messages,
            feeds: Feeds,
            accounts: Accounts,
            global: Global,
        }), applyMiddleware(thunk, logger)
    );

    return store;
}
