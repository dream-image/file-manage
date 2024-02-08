
import { createStore } from "redux";

let initial = {
    openedFileContext: {
        '': {
            handle: null,
            copyContext: '',
            hasChange: false,
            type: ''
        }
    },
    currentFocusContext: {
        name: "",
        path: [],
        type: '',
        targetString: "",
        dirRootHandle: undefined,
        currentHandle: undefined,

    }
};
const reducer = (state = initial, action) => {
    state = { ...state };

    switch (action.type) {
        case "openedFile":
            state.openedFileContext = {
                ...state.openedFileContext,
                ...action.data
            }
            break;
        case "currentFocus":{
            state.currentFocusContext = {
                ...state.currentFocusContext,
                ...action.data
            }
        }
        default:
    }
    return state;
};

const store = createStore(reducer);
export default store;
