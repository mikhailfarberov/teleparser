import * as ActionTypes from './ActionTypes';

export const Accounts = (state = {
    isLoading: true,
    errMessage: null,
    data: [],
    modals: {"accounts": false},
    active: {"accounts": null},
}, action) => {
    switch(action.type) {
        case ActionTypes.ADD_ACCOUNTS:
            return {...state, isLoading: false, errMessage: null, data: {"accounts": action.payload}};
        case ActionTypes.ACCOUNTS_LOADING:
            return {...state, isLoading: true, errMessage: null, data: []};
        case ActionTypes.ACCOUNTS_FAILED:
            return {...state, isLoading: false, errMessage: action.payload, data: []};
        case ActionTypes.TOGGLE_ACCOUNTS:
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
        default:
            return state;
    }
}