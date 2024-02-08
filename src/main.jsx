
import ReactDOM from 'react-dom/client'
import App from './pages/App.jsx'
import Layout from './views/layout.jsx'
// import './index.css'
import { createContext } from 'react'
import { useState } from 'react'
import Context from "./contexts/Context.js"
import { ConfigProvider } from 'antd'
const ThemeContext = createContext('light')

import store from './store'

const Main = (props) => {

  return (
    <ConfigProvider theme={{
      components: {
        Button: {
          defaultActiveBorderColor: "#4fc3f7",
          defaultHoverBorderColor: "#71c4ef",
          defaultBorderColor: "#eceff1"
        },
      },
    }}>
      <Context.Provider value={store}>
        <Layout  >
          <App />
        </Layout>

      </Context.Provider>



    </ConfigProvider>

  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Main />

)
