import { useNavigate, useLocation, Outlet } from 'react-router'; // useNavigate, Outlet 추가
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthenticatedLayout() {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 경로와 일치하는지 확인
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            <button onClick={() => navigate('/home')} className="flex items-center gap-2 cursor-pointer">
              <img src="/logo_white.png" alt="링크디매치" className="h-10" />
              <span className="text-2xl font-bold text-slate-900">LinkD-Match</span>
            </button>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => navigate('/system-console')}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                    isActive('/system-console') ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  System Console
                </button>
              )}
              <button
                onClick={() => navigate('/recommend')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  isActive('/recommend') ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Recommendation
              </button>
              <button
                onClick={() => navigate('/interest')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  isActive('/interest') ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                My Picks
              </button>
              <button
                onClick={() => navigate('/Insights')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  isActive('/Insights') ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Data Insights
              </button>
              <button
                onClick={() => navigate('/my')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  isActive('/my') ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                My
              </button>

              <div className="w-px h-8 bg-slate-200 mx-2" />
              <button onClick={logout} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
