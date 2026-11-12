import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import { App } from '@/app/App';
import { runAutoClose } from '@/features/calls/callService';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

// US-028: close calls Resolved > 7 days before any page reads the data
runAutoClose();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
