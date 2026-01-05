import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@/contexts/AuthContext';
import { PicksProvider } from '@/contexts/PicksContext';
import { WalletProvider } from '@/contexts/WalletContext';
import App from './App.tsx';
import './index.css';
import 'flag-icons/css/flag-icons.min.css';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <WalletProvider>
      <PicksProvider>
        <App />
      </PicksProvider>
    </WalletProvider>
  </AuthProvider>
);
