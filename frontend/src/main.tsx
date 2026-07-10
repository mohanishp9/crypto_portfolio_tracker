import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ToastContainer from './components/ToastContainer.tsx'
import { LivePriceProvider } from './context/LivePriceContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'always'
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <ThemeProvider>
        <Provider store={store}>
          <BrowserRouter>
            <LivePriceProvider>
              <App />
              <ToastContainer />
            </LivePriceProvider>
          </BrowserRouter>
        </Provider>
      </ThemeProvider>
    </PostHogProvider>
  </StrictMode>,
)
