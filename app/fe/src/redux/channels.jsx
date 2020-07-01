import * as ActionTypes from './ActionTypes';

export const Channels = (state = {
    isLoading: true,
    errMessage: null,
    data: [],
    modals: {"channels": false},
    active: {"channels": null},
}, action) => {
    switch(action.type) {
        case ActionTypes.ADD_CHANNELS:
            return {...state, isLoading: false, errMessage: null, data: {"channels": action.payload}};
        case ActionTypes.CHANNELS_LOADING:
            return {...state, isLoading: true, errMessage: null, data: []};
        case ActionTypes.CHANNELS_FAILED:
            return {...state, isLoading: false, errMessage: action.payload, data: []};
        case ActionTypes.TOGGLE_CHANNELS:
            state.modals[action.payload[0]] = action.payload[1]
            if (action.payload[2] !== undefined) {
                state.active[action.payload[0]] = null
                if (state.data[action.payload[0]] !== undefined) {
                    for (let item of state.data[action.payload[0]]) {
                        if (item.id == action.payload[2]) {
                            state.active[action.payload[0]] = item
                            break
                        }
                    }
                }
            } 
            return {...state};
        case ActionTypes.ADD_CHANNEL_DROPS:
            if (state.active['channels']) {
                state.active['channels']['drops'].push({'id': -state.active['channels']['drops'].length - 1, 'expr': ''})
            }
            return {...state};
        case ActionTypes.ADD_CHANNEL_REPLACEMENTS:
            if (state.active['channels']) {
                state.active['channels']['replacements'].push({'id': -state.active['channels']['replacements'].length - 1, 'expr_search': '', 'expr_replace': ''})
            }
            return {...state};
        case ActionTypes.ADD_CHANNEL_WHITELIST:
            if (state.active['channels']) {
                state.active['channels']['whitelist'].push({'id': -state.active['channels']['whitelist'].length - 1, 'url': ''})
            }
            return {...state};
        case ActionTypes.REMOVE_CHANNEL_DROPS:
            if (state.active['channels']) {
                let new_drops = []
                for (let row of state.active['channels']['drops']) {
                    if (row['id'] != action.payload)
                        new_drops.push(row)
                }
                state.active['channels']['drops'] = new_drops
            }
            return {...state};
        case ActionTypes.REMOVE_CHANNEL_REPLACEMENTS:
            if (state.active['channels']) {
                let new_replacements = []
                for (let row of state.active['channels']['replacements']) {
                    if (row['id'] != action.payload)
                        new_replacements.push(row)
                }
                state.active['channels']['replacements'] = new_replacements
            }
            return {...state};
        case ActionTypes.REMOVE_CHANNEL_WHITELIST:
            if (state.active['channels']) {
                let new_whitelist = []
                for (let row of state.active['channels']['whitelist']) {
                    if (row['id'] != action.payload)
                        new_whitelist.push(row)
                }
                state.active['channels']['whitelist'] = new_whitelist
            }
            return {...state};
        case ActionTypes.EDIT_CHANNEL_DROPS:
            if (state.active['channels']) {
                for (let idx in state.active['channels']['drops']) {
                    if (state.active['channels']['drops'][idx]['id'] == action.payload[0])
                        state.active['channels']['drops'][idx][action.payload[1]] = action.payload[2]
                }
            }
            return {...state};
        case ActionTypes.EDIT_CHANNEL_REPLACEMENTS:
            if (state.active['channels']) {
                for (let idx in state.active['channels']['replacements']) {
                    if (state.active['channels']['replacements'][idx]['id'] == action.payload[0])
                        state.active['channels']['replacements'][idx][action.payload[1]] = action.payload[2]
                }
            }
            return {...state};
        case ActionTypes.EDIT_CHANNEL_WHITELIST:
            if (state.active['channels']) {
                for (let idx in state.active['channels']['whitelist']) {
                    if (state.active['channels']['whitelist'][idx]['id'] == action.payload[0])
                        state.active['channels']['whitelist'][idx][action.payload[1]] = action.payload[2]
                }
            }
            return {...state};
        default:
            return state;
    }
}