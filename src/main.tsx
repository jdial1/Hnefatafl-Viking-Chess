import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { randomizeCelticTheme } from './utils/celticTheme';

// Randomize Celtic knot pattern & color set on every load
randomizeCelticTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
