
import ReactDOM from 'react-dom/client'
import App from './pages/App.jsx'
import Layout from './views/layout.jsx'
// import './index.css'
import { createContext } from 'react'
import { useState } from 'react'
import { CurrentFocusContext } from './contexts/currentFocusContext.js'

import { ConfigProvider } from 'antd'
const ThemeContext = createContext('light')



const Main = (props) => {
  const [focus, setFocus] = useState({
    name: null,
    path: '/',
    type: 'dir'
  })
  return (
    <ConfigProvider theme={{
      components: {
        Button: {
          defaultActiveBorderColor: "#4fc3f7",
          defaultHoverBorderColor:"#71c4ef"
        },
      },
    }}>
      <CurrentFocusContext.Provider value={focus} >
        <Layout changeFocus={setFocus}>
          <App />
        </Layout>
      </CurrentFocusContext.Provider>
    </ConfigProvider>

  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Main />

)
