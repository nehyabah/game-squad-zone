import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@/contexts/AuthContext';
import { PicksProvider } from '@/contexts/PicksContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <PicksProvider>
      <App />
    </PicksProvider>
  </AuthProvider>
);
