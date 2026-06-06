import { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { AdminRoute } from '../navigation/routes';
import { BusinessTypesScreen } from './BusinessTypesScreen';
import { DashboardScreen } from './DashboardScreen';
import { PlaceholderScreen } from './PlaceholderScreen';
import { SubscribersScreen } from './SubscribersScreen';
import { SubscriptionPlansScreen } from './SubscriptionPlansScreen';

type AdminShellProps = {
  token: string;
  onLogout: () => void;
};

export function AdminShell({ token, onLogout }: AdminShellProps) {
  const [route, setRoute] = useState<AdminRoute>('dashboard');

  const renderScreen = () => {
    switch (route) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'business-types':
        return <BusinessTypesScreen token={token} />;
      case 'subscribers':
        return <SubscribersScreen token={token} />;
      case 'plans':
        return <SubscriptionPlansScreen token={token} />;
      case 'taxes':
        return (
          <PlaceholderScreen
            title="Taxes"
            description="Define government taxes applied per subscription plan"
            features={[
              'Create tax rules with rates',
              'Assign taxes to specific plans',
              'Activate or deactivate taxes',
            ]}
          />
        );
      case 'discounts':
        return (
          <PlaceholderScreen
            title="Discounts"
            description="Apply discounts for all or specific subscribers"
            features={[
              'Percentage or fixed discounts',
              'Global or subscriber-specific scope',
              'Validity date ranges',
            ]}
          />
        );
      case 'reports':
        return (
          <PlaceholderScreen
            title="Reports"
            description="Platform-wide revenue and subscription analytics"
            features={[
              'Revenue reports',
              'Pending and expiring subscriptions',
              'Breakdown by business type',
              'Export and print',
            ]}
          />
        );
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <AdminLayout activeRoute={route} onNavigate={setRoute} onLogout={onLogout}>
      {renderScreen()}
    </AdminLayout>
  );
}
