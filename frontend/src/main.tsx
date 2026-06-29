import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ToastContainer from './components/ToastContainer.tsx'
import { LivePriceProvider } from './context/LivePriceContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <LivePriceProvider>
          <App />
          <ToastContainer />
        </LivePriceProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
