import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Trophy } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { InfluencerProfileModal } from './InfluencerProfileModal';
import { CompareInfluencers } from './CompareInfluencers';
import { Influencer } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export function StatisticsChart() {
  const { influencers, selectionHistory } = useInfluencers();
  const [selectedInfluencer, setSelectedInfluencer] = useState<{ influencer: Influencer; rank: number } | null>(null);

  // Total Selections
  const totalSelections = useMemo(() => {
    return influencers.reduce((sum, inf) => sum + inf.selections, 0);
  }, [influencers]);

  // Top Performer
  const topPerformer = useMemo(() => {
    return influencers.reduce((top, inf) => (inf.selections > top.selections ? inf : top), influencers[0]);
  }, [influencers]);

  // Top 10 Leaderboard
  const leaderboard = useMemo(() => {
    return [...influencers].sort((a, b) => b.selections - a.selections).slice(0, 10);
  }, [influencers]);

  // Selection Trend Data (Last 7 days)
  const trendData = useMemo(() => {
    return selectionHistory
      .slice(-7)
      .map((history) => ({
        date: new Date(history.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        selections: history.count,
      }));
  }, [selectionHistory]);

  // Category Distribution
  const categoryData = useMemo(() => {
    const distribution: Record<string, number> = {};

    influencers.forEach((inf) => {
      distribution[inf.category] = (distribution[inf.category] || 0) + inf.selections;
    });

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

    return Object.entries(distribution)
      .map(([category, count]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.value - a.value);
  }, [influencers]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Data Insights</h1>
        <p className="text-slate-600">For your informed decision-making</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{totalSelections}</div>
          <div className="text-sm text-slate-600">Total Selections</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1 truncate">{topPerformer?.name}</div>
          <div className="text-sm text-slate-600">Top Performer</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{influencers.length}</div>
          <div className="text-sm text-slate-600">Total Influencers</div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Selection Trend Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Daily Selection Trends</h2>
            <p className="text-sm text-slate-600">Selection Activity (Last 7 Days)</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="selections"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Selection Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6">Category Selection Distribution</h2>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
            {categoryData.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="font-semibold text-slate-900">{category.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-lg font-bold text-slate-900">{category.value} selections</span>
                  <span className="text-sm font-semibold text-purple-600 min-w-[50px] text-right">
                    {category.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Influencer Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-6">Influencer Leaderboard</h2>
        <div className="space-y-4">
          {leaderboard.map((influencer, index) => (
            <div
              key={influencer.id}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>

              {/* Photo */}
              <img
                src={influencer.photo}
                alt={influencer.name}
                className="w-16 h-16 rounded-xl object-cover"
              />

              {/* Info */}
              <div className="flex-1">
                <button
                  onClick={() => setSelectedInfluencer({ influencer, rank: index + 1 })}
                  className="font-bold text-slate-900 hover:text-purple-600 transition-colors text-left"
                >
                  {influencer.name}
                </button>
                <p className="text-sm text-slate-600">
                  {influencer.followers >= 1000
                    ? `${(influencer.followers / 1000).toFixed(1)}K`
                    : influencer.followers}{' '}
                  followers
                </p>
              </div>

              {/* Category */}
              <div className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold capitalize">
                {influencer.category}
              </div>

              {/* Selections */}
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{influencer.selections}</div>
                <div className="text-xs text-slate-600">selections</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Compare Influencers */}
      <div className="mt-8">
        <CompareInfluencers />
      </div>

      {/* Profile Modal */}
      {selectedInfluencer && (
        <InfluencerProfileModal
          influencer={selectedInfluencer.influencer}
          rank={selectedInfluencer.rank}
          onClose={() => setSelectedInfluencer(null)}
        />
      )}
    </div>
  );
}
