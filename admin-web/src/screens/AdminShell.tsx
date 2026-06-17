import { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { AdminRoute } from '../navigation/routes';
import { BusinessTypesScreen } from './BusinessTypesScreen';
import { DashboardScreen } from './DashboardScreen';
import { ReportsScreen } from './ReportsScreen';
import { SubscribersScreen } from './SubscribersScreen';
import { SubscriptionPlansScreen } from './SubscriptionPlansScreen';
import { TaxesScreen } from './TaxesScreen';
import { DiscountsScreen } from './DiscountsScreen';
import { SettingsScreen } from './SettingsScreen';
import { SystemMonitorScreen } from './SystemMonitorScreen';

type AdminShellProps = {
  token: string;
  onLogout: () => void;
};

export function AdminShell({ token, onLogout }: AdminShellProps) {
  const [route, setRoute] = useState<AdminRoute>('dashboard');

  const renderScreen = () => {
    switch (route) {
      case 'dashboard':
        return <DashboardScreen token={token} />;
      case 'business-types':
        return <BusinessTypesScreen token={token} />;
      case 'subscribers':
        return <SubscribersScreen token={token} />;
      case 'plans':
        return <SubscriptionPlansScreen token={token} />;
      case 'taxes':
        return <TaxesScreen token={token} />;
      case 'discounts':
        return <DiscountsScreen token={token} />;
      case 'reports':
        return <ReportsScreen token={token} />;
      case 'system-monitor':
        return <SystemMonitorScreen token={token} />;
      case 'settings':
        return <SettingsScreen token={token} />;
      default:
        return <DashboardScreen token={token} />;
    }
  };

  return (
    <AdminLayout activeRoute={route} onNavigate={setRoute} onLogout={onLogout}>
      {renderScreen()}
    </AdminLayout>
  );
}
