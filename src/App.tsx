import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/app/router';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';

export function App() {
  return (
    <AppProviders>
      <AppRouter />
      <PWAInstallBanner />
    </AppProviders>
  );
}

export default App;
