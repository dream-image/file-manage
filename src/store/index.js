
import { createStore } from "redux";

let initial = {
    openedFileContext: {
        '': {
            handle: null,
            copyContext: '',
            originContext: '',
            hasChange: false,
            type: ''
        }
    },
    currentFocusContext: {
        dirRootHandle: undefined,
        name: "",
        path: [],
        targetString: "",
        type: "",
        currentHandle: undefined,
    },
    config: {
        gap: 5,
        autoSave: false,
        hasMaxOfLeftBarWidth: true
    }
};
const reducer = (state = initial, action) => {
    state = { ...state };
    // console.log(action)
    switch (action.type) {
        case "openedFile":
            state.openedFileContext = {
                ...state.openedFileContext,
                ...action.data
            }
            break;
        case "currentFocus": {
            state.currentFocusContext = {
                ...state.currentFocusContext,
                ...action.data
            }
        }
            break;
        case "closeFile": {
            delete state.openedFileContext[action.wholePath]
        }
            break;
        case "clear": {
            state.currentFocusContext = {
                dirRootHandle: undefined,
                name: "",
                path: [],
                targetString: "",
                type: "",
                currentHandle: undefined,
                wholePath: ""
            }
            state.openedFileContext = {
                '': {
                    handle: null,
                    copyContext: '',
                    hasChange: false,
                    type: ''
                }
            }
        }
            break;
        case "config": {
            state.config = {
                ...state.config,
                ...action.config
            }
        }
            break;
        default:
    }
    return state;
};

const store = createStore(reducer);
export default store;
