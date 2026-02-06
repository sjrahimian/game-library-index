import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import App from './pages/App';
import { HydrationProvider } from './hooks/HydrationContext';

createRoot(document.getElementById('root')!).render(
  
  <StrictMode>
    <HydrationProvider>
      <App />
    </HydrationProvider>
  </StrictMode>,
)
