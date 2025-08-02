import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import App from './App'
import theme from './theme'
import { AuthProvider } from './contexts/AuthContext'
import { I18nProvider } from './contexts/I18nContext'
import ErrorBoundary from './components/ErrorBoundary'

import './config/firebase' // Firebase初期化
import './i18n' // i18n初期化

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <I18nProvider>
            <AuthProvider>
              <App />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)