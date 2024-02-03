
import ReactDOM from 'react-dom/client'
import App from './pages/App.jsx'
import Layout from './views/layout.jsx'
import './index.css'
import { createContext } from 'react'
import { useState } from 'react'
import {CurrentFocusContext} from './contexts/currentFocusContext.js'

const ThemeContext = createContext('light')



const Main = (props) => {
  const [focus, setFocus] = useState({
    name: null,
    path: '/',
    type: 'dir'
  })
  return (
    <CurrentFocusContext.Provider value={focus}>
      <Layout changeFocus={setFocus}>
        <App />
      </Layout>
    </CurrentFocusContext.Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Main/>

)
