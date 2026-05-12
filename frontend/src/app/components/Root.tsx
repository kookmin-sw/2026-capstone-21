import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LandingPage } from './LandingPage';
import { AuthenticatedLayout } from './AuthenticatedLayout';

export function Root() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      navigate('/my');
    }
  }, [isAuthenticated]);

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
