import * as ActionTypes from './ActionTypes';

export const Global = (state = {
    isLoading: true,
    errMessage: null,
    data: [],
    modals: {"envs": false, "drops": false, "replacements": false, "whitelist": false},
    active: {"envs": 0, "drops": 0, "replacements": 0, "whitelist": 0},
}, action) => {
    switch(action.type) {
        case ActionTypes.ADD_GLOBAL:
            return {...state, isLoading: false, errMessage: null, data: action.payload};
        case ActionTypes.GLOBAL_LOADING:
            return {...state, isLoading: true, errMessage: null, data: []};
        case ActionTypes.GLOBAL_FAILED:
            return {...state, isLoading: false, errMessage: action.payload, data: []};
        case ActionTypes.TOGGLE_GLOBAL:
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