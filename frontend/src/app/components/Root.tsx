import { useAuth } from '../context/AuthContext';
import { LandingPage } from './LandingPage';
import { AuthenticatedLayout } from './AuthenticatedLayout';

export function Root() {
  const { isAuthenticated } = useAuth();

  const handleNavigation = () => {
    // Navigation will be handled after authentication
  };

  if (!isAuthenticated) {
    return (
      <LandingPage
        onShowLogin={handleNavigation}
        onShowProfile={handleNavigation}
        onShowInterest={handleNavigation}
        onShowStats={handleNavigation}
      />
    );
  }

  return <AuthenticatedLayout />;
}
