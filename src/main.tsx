import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './components/ThemeProvider';
import './index.css';
import { automationScheduler } from './lib/automationScheduler';

// Démarrer le planificateur d'automatisations au lancement de l'application
automationScheduler.start();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
