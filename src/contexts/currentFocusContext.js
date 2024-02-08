import { createContext } from 'react'
export const CurrentFocusContext = createContext({
  name: null,
  path: [],
  type: '',
  targetString:"",
  dirRootHandle:null,

})
