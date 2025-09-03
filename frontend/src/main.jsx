import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import App from './App.jsx'

// Create Material-UI theme
const theme = createTheme({
  typography: {
    fontFamily: 'Roboto, "Helvetica", "Arial", sans-serif',
  },
})

createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}> {/* MUI Theme Provider */}
    <CssBaseline />
    <App />
  </ThemeProvider>
)
