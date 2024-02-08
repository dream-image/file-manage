import { createContext } from 'react'
export const CurrentFocusContext = createContext({
  name: "",
  path: [],
  type: '',
  targetString:"",
  dirRootHandle:undefined,
  currentHandle:undefined,
  
})
