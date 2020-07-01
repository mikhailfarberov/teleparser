import * as ActionTypes from './ActionTypes';

export const Messages = (state = {
    isLoading: true,
    errMessage: null,
    data: {},
    channelId: 0,
    pageIndex: {"new": 0, "published": 0, "moderated": 0, "filtered": 0},
    pageSize: 50,
    pageCount: 5,
    activeTab: "new"
}, action) => {
    switch(action.type) {
        case ActionTypes.ADD_MESSAGES:
            return {...state, isLoading: false, errMessage: null, data: action.payload};
        case ActionTypes.MESSAGES_LOADING:
            return {...state, isLoading: true, errMessage: null, data: {}};
        case ActionTypes.MESSAGES_FAILED:
            return {...state, isLoading: false, errMessage: action.payload, data: {}};
        case ActionTypes.PAGE_MESSAGES:
            switch (action.payload) {
                case 'prev':
                    state.pageIndex[state.activeTab] -= 1
                break;
                case 'next':
                    state.pageIndex[state.activeTab] += 1
                break;
                default:
                    state.pageIndex[state.activeTab] = parseInt(action.payload)
            }
            return {...state, isLoading: false, errMessage: action.payload, pageIndex: state.pageIndex};
        case ActionTypes.TAB_MESSAGES:
            state.pageIndex[action.payload] = 0
            return {...state, isLoading: false, activeTab: action.payload, pageIndex: state.pageIndex};
        default:
            return state;
    }
}