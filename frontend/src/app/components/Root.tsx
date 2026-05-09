import { useAuth } from '../context/AuthContext';
import { LandingPage } from './LandingPage';
import { AuthenticatedLayout } from './AuthenticatedLayout';

export function Root() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <LandingPage
        onShowLogin={() => {}}
        onShowProfile={() => {}}
        onShowInterest={() => {}}
        onShowStats={() => {}}
      />
    );
  }

  return <AuthenticatedLayout />;
}
