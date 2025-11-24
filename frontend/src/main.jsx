import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import * as Sentry from "@sentry/react"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  replaysSessionSampleRate: 1.0, // Capture 100% of sessions for performance monitoring
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
});

// Caching and retries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
