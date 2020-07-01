import * as ActionTypes from './ActionTypes';

export const Feeds = (state = {
    isLoading: true,
    errMessage: null,
    data: [],
    modals: {"feeds": false},
    active: {"feeds": null},
}, action) => {
    switch(action.type) {
        case ActionTypes.ADD_FEEDS:
            return {...state, isLoading: false, errMessage: null, data: {"feeds": action.payload}};
        case ActionTypes.FEEDS_LOADING:
            return {...state, isLoading: true, errMessage: null, data: []};
        case ActionTypes.FEEDS_FAILED:
            return {...state, isLoading: false, errMessage: action.payload, data: []};
        case ActionTypes.TOGGLE_FEEDS:
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