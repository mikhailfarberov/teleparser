import * as ActionTypes from './ActionTypes';
import UrlHelper from '../helpers/UrlHelper';

// Channels
export const fetchChannels = () => async dispatch => {
    dispatch(channelsLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/channels/')
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(channels => dispatch(addChannels(channels)))
        .catch(error => dispatch(channelsFailed(error.message)));
};

export const channelsLoading = () => (
    {
        type: ActionTypes.CHANNELS_LOADING
    }
);

export const channelsFailed = (errmessage) => (
    {
        type: ActionTypes.CHANNELS_FAILED,
        payload: errmessage
    }
);

export const addChannels = (channels) => (
    {
        type: ActionTypes.ADD_CHANNELS,
        payload: channels
    }
);

export const toggleChannels = (type, value, id) => (
    {
        type: ActionTypes.TOGGLE_CHANNELS,
        payload: [type, value, id]
    }
);

export const addChannelDrops = () => (
    {
        type: ActionTypes.ADD_CHANNEL_DROPS,
        payload: 0
    }
);

export const addChannelReplacements = () => (
    {
        type: ActionTypes.ADD_CHANNEL_REPLACEMENTS,
        payload: 0
    }
);

export const addChannelWhitelist = () => (
    {
        type: ActionTypes.ADD_CHANNEL_WHITELIST,
        payload: 0
    }
);

export const removeChannelDrops = (id) => (
    {
        type: ActionTypes.REMOVE_CHANNEL_DROPS,
        payload: id
    }
);

export const removeChannelReplacements = (id) => (
    {
        type: ActionTypes.REMOVE_CHANNEL_REPLACEMENTS,
        payload: id
    }
);

export const removeChannelWhitelist = (id) => (
    {
        type: ActionTypes.REMOVE_CHANNEL_WHITELIST,
        payload: id
    }
);

export const editChannelDrops = (id, key, value) => (
    {
        type: ActionTypes.EDIT_CHANNEL_DROPS,
        payload: [id, key, value]
    }
);

export const editChannelReplacements = (id, key, value) => (
    {
        type: ActionTypes.EDIT_CHANNEL_REPLACEMENTS,
        payload: [id, key, value]
    }
);

export const editChannelWhitelist = (id, key, value) => (
    {
        type: ActionTypes.EDIT_CHANNEL_WHITELIST,
        payload: [id, key, value]
    }
);

export const updateChannel = (id, source, params, drops, replacements, whitelist) => async dispatch => {
    dispatch(channelsLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/channels/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'id': id,
                        'source': source,
                        'channel': params,
                        'drops': drops,
                        'replacements': replacements,
                        'whitelist': whitelist
                    }
                )
            }
        )
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(channels => dispatch(addChannels(channels)))
        .catch(error => dispatch(channelsFailed(error.message)));
};

// Messages
export const fetchMessages = (channelId, filter, offset, count) => async dispatch => {
    dispatch(messagesLoading(true));
    return fetch(UrlHelper.getUrlBackend() + '/messages/' + channelId + '?offset=' + offset + '&count=' + count + '&filter=' + filter)
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(messages => dispatch(addMessages(messages)))
        .catch(error => dispatch(messagesFailed(error.message)));
};

export const messagesLoading = () => (
    {
        type: ActionTypes.MESSAGES_LOADING
    }
);

export const messagesFailed = (errmessage) => (
    {
        type: ActionTypes.MESSAGES_FAILED,
        payload: errmessage
    }
);

export const addMessages = (messages) => (
    {
        type: ActionTypes.ADD_MESSAGES,
        payload: messages
    }
);

export const tabMessages = (tab) => (
    {
        type: ActionTypes.TAB_MESSAGES,
        payload: tab
    }
);

export const pageMessages = (pageIndex) => (
    {
        type: ActionTypes.PAGE_MESSAGES,
        payload: pageIndex
    }
);

export const updateMessage = (channel_id, id, key, val, filter, offset, count) => async dispatch => {
    dispatch(messagesLoading(true));

    let upd = {}
    upd[key] = val

    return fetch(UrlHelper.getUrlBackend() + '/messages/' + channel_id + '?filter=' + filter + '&offset=' + offset + '&count=' + count,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({'id': id, 'msg': upd})
            }
        ).then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(messages => dispatch(addMessages(messages)))
        .catch(error => dispatch(messagesFailed(error.message)));
};

// Feeds
export const fetchFeeds = () => async dispatch => {
    dispatch(feedsLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/feeds/')
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(feeds => dispatch(addFeeds(feeds)))
        .catch(error => dispatch(feedsFailed(error.message)));
};

export const feedsLoading = () => (
    {
        type: ActionTypes.FEEDS_LOADING
    }
);

export const feedsFailed = (errmessage) => (
    {
        type: ActionTypes.FEEDS_FAILED,
        payload: errmessage
    }
);

export const addFeeds = (feeds) => (
    {
        type: ActionTypes.ADD_FEEDS,
        payload: feeds
    }
);

export const toggleFeeds = (type, value, id) => (
    {
        type: ActionTypes.TOGGLE_FEEDS,
        payload: [type, value, id]
    }
);

export const updateFeed = (id, params, envs, channels) => async dispatch => {
    dispatch(feedsLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/feeds/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'id': id,
                        'feed': params,
                        'envs': envs,
                        'channels': channels
                    }
                )
            }
        )
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(feeds => dispatch(addFeeds(feeds)))
        .catch(error => dispatch(feedsFailed(error.message)));
};

export const deleteFeed = (id) => async dispatch => {
    dispatch(feedsLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/feeds/',
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'id': id,
                    }
                )
            }
        )
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(feeds => dispatch(addFeeds(feeds)))
        .catch(error => dispatch(feedsFailed(error.message)));
};

// Accounts
export const fetchAccounts = () => async dispatch => {
    dispatch(accountsLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/accounts/')
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(accounts => dispatch(addAccounts(accounts)))
        .catch(error => dispatch(accountsFailed(error.message)));
};

export const accountsLoading = () => (
    {
        type: ActionTypes.ACCOUNTS_LOADING
    }
);

export const accountsFailed = (errmessage) => (
    {
        type: ActionTypes.ACCOUNTS_FAILED,
        payload: errmessage
    }
);

export const addAccounts = (accounts) => (
    {
        type: ActionTypes.ADD_ACCOUNTS,
        payload: accounts
    }
);

export const toggleAccounts = (type, value, id) => (
    {
        type: ActionTypes.TOGGLE_ACCOUNTS,
        payload: [type, value, id]
    }
);

export const updateAccount = (id, source, username, password, user_id, feeds) => async dispatch => {
    dispatch(accountsLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/accounts/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'id': id,
                        'source': source,
                        'username': username,
                        'password': password,
                        'user_id': user_id,
                        'feeds': feeds
                    }
                )
            }
        )
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(accounts => dispatch(addAccounts(accounts)))
        .catch(error => dispatch(accountsFailed(error.message)));
};

export const deleteAccount = (id) => async dispatch => {
    dispatch(accountsLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/accounts/',
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'id': id,
                    }
                )
            }
        )
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(accounts => dispatch(addAccounts(accounts)))
        .catch(error => dispatch(accountsFailed(error.message)));
};

// Global
export const fetchGlobal = () => async dispatch => {
    dispatch(globalLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/global/')
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(global => dispatch(addGlobal(global)))
        .catch(error => dispatch(globalFailed(error.message)));
};

export const globalLoading = () => (
    {
        type: ActionTypes.GLOBAL_LOADING
    }
);

export const globalFailed = (errmessage) => (
    {
        type: ActionTypes.GLOBAL_FAILED,
        payload: errmessage
    }
);

export const addGlobal = (global) => (
    {
        type: ActionTypes.ADD_GLOBAL,
        payload: global
    }
);

export const toggleGlobal = (type, value, id) => (
    {
        type: ActionTypes.TOGGLE_GLOBAL,
        payload: [type, value, id]
    }
);

export const updateGlobal = (data) => async dispatch => {
    dispatch(globalLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/global/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        )
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(global => dispatch(addGlobal(global)))
        .catch(error => dispatch(globalFailed(error.message)));
};

export const deleteGlobal = (data) => async dispatch => {
    dispatch(globalLoading(true));

    return fetch(UrlHelper.getUrlBackend() + '/global/',
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        )
        .then(response => { 
            if (response.ok) {
                return response;
            } else {
                var error = new Error('Error ' + response.status + ': ' + response.statusText);
                error.response = response;
                throw error;
            }
        }, 
        error => {
            var errmess = new Error(error.message);
            throw errmess;
        })
        .then(response => response.json())
        .then(global => dispatch(addGlobal(global)))
        .catch(error => dispatch(globalFailed(error.message)));
};