import { useState } from 'react';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InfluencerProfile } from './InfluencerProfile';
import { InterestList } from './InterestList';
import { StatisticsChart } from './StatisticsChart';
import { SystemConsole } from './SystemConsole';

type View = 'profile' | 'interest' | 'statistics' | 'system-console';

export function AuthenticatedLayout() {
  const [currentView, setCurrentView] = useState<View>('profile');
  const { logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                console.log('Logo clicked, navigating to profile');
                setCurrentView('profile');
              }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-xl">
                D
              </div>
              <span className="text-2xl font-bold text-slate-900">링크디매치</span>
            </button>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('system-console')}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                    currentView === 'system-console'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  System Console
                </button>
              )}
              <button
                onClick={() => setCurrentView('profile')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  currentView === 'profile'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Find Influencers
              </button>
              <button
                onClick={() => setCurrentView('interest')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  currentView === 'interest'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                My Picks
              </button>
              <button
                onClick={() => setCurrentView('statistics')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  currentView === 'statistics'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Data Insights
              </button>

              <div className="w-px h-8 bg-slate-200 mx-2" />

              <button
                onClick={logout}
                className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      {currentView === 'system-console' ? (
        <SystemConsole />
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'profile' && <InfluencerProfile />}
            {currentView === 'interest' && <InterestList />}
            {currentView === 'statistics' && <StatisticsChart />}
          </motion.div>
        </main>
      )}
    </div>
  );
}
