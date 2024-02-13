import Content from "../components/Content"
import './App.css'
import { useContext, useState,useEffect } from "react"
import Context from "../contexts/Context"
function App() {
  const store = useContext(Context)
  const [state, setState] = useState(store.getState())
  useEffect(() => {
    let unsubscribe = store.subscribe(() => {
      setState(store.getState())
    })
    return () => {
      unsubscribe()
    }
  }, [])
  return (
    <Content openedFileList={state.openedFileContext} currentFocus={state.currentFocusContext} autoSave={state.config.autoSave} store={store}></Content>
  )
}

export default App
