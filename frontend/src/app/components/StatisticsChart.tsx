import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Trophy } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { InfluencerProfileModal } from './InfluencerProfileModal';
import { CompareInfluencers } from './CompareInfluencers';
import { Influencer } from '../types';
import {
  getTotalSelections,
  getTotalInfluencers,
  getDailyTrends,
} from '../../api/insight';
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

const COLORS = [
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
];

type DailyTrend = {
  date: string;
  count?: number;
  selections?: number;
};

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatFollowers(followers: number) {
  if (followers >= 10000) {
    return `${(followers / 10000).toFixed(1)}만`;
  }

  if (followers >= 1000) {
    return `${(followers / 1000).toFixed(1)}K`;
  }

  return followers.toLocaleString();
}

function normalizeCategory(category?: string | null): string {
  const aliasMap: Record<string, string> = {
    푸드맛집: '푸드·맛집',
    헬스웰니스: '헬스·웰니스',
    육아가족: '육아·가족',
  };

  if (!category) return '기타';

  return aliasMap[category] || category;
}

function getGradeScore(influencer: Influencer): number {
  const gradeScore =
    (influencer as any).gradeScore ??
    (influencer as any).grade_score ??
    (influencer as any).grade ??
    0;

  const parsedScore = Number(gradeScore);

  return Number.isNaN(parsedScore) ? 0 : parsedScore;
}

function formatGradeScore(influencer: Influencer) {
  const score = getGradeScore(influencer);

  return score.toFixed(2);
}

export function StatisticsChart() {
  const { influencers } = useInfluencers();

  const [totalSelections, setTotalSelections] = useState(0);
  const [totalInfluencers, setTotalInfluencers] = useState(0);
  const [trendData, setTrendData] = useState<
    { date: string; selections: number }[]
  >([]);
  const [selectedInfluencer, setSelectedInfluencer] =
    useState<Influencer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const topFollowerInfluencer = useMemo(() => {
    if (influencers.length === 0) return null;

    return [...influencers].sort((a, b) => b.followers - a.followers)[0];
  }, [influencers]);

  const leaderboard = useMemo(() => {
    return [...influencers]
      .sort((a, b) => getGradeScore(b) - getGradeScore(a))
      .slice(0, 10);
  }, [influencers]);

  const categoryData = useMemo(() => {
    const distribution: Record<string, number> = {};

    influencers.forEach((influencer) => {
      const category = normalizeCategory(influencer.category);
      distribution[category] = (distribution[category] || 0) + 1;
    });

    const total = Object.values(distribution).reduce(
      (sum, count) => sum + count,
      0
    );

    return Object.entries(distribution)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.value - a.value);
  }, [influencers]);

  const fetchInsights = async () => {
    try {
      const [totalSelectionsData, totalInfluencersData, dailyTrendsData] =
        await Promise.all([
          getTotalSelections(),
          getTotalInfluencers(),
          getDailyTrends(),
        ]);

      setTotalSelections(totalSelectionsData.total || 0);
      setTotalInfluencers(totalInfluencersData.total || 0);

      const mappedTrendData = (dailyTrendsData as DailyTrend[]).map((item) => ({
        date: formatDate(item.date),
        selections: item.selections ?? item.count ?? 0,
      }));

      setTrendData(mappedTrendData);
    } catch (error) {
      console.error('Data Insights 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();

    const interval = setInterval(fetchInsights, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Data Insights
        </h1>
        <p className="text-slate-600">For your informed decision-making</p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-200 text-center text-slate-600">
          Loading insights...
        </div>
      ) : (
        <>
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

              <div className="text-3xl font-bold text-slate-900 mb-1">
                {totalSelections}
              </div>

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

              <div className="text-2xl font-bold text-slate-900 mb-1 truncate">
                {topFollowerInfluencer?.name || 'No data'}
              </div>

              <div className="text-sm text-slate-600">
                Top Follower ·{' '}
                {topFollowerInfluencer
                  ? `${formatFollowers(
                      topFollowerInfluencer.followers
                    )} followers`
                  : '0 followers'}
              </div>
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

              <div className="text-3xl font-bold text-slate-900 mb-1">
                {totalInfluencers}
              </div>

              <div className="text-sm text-slate-600">Total Influencers</div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Daily Selection Trends
                </h2>
                <p className="text-sm text-slate-600">
                  Selection Activity Over Time
                </p>
              </div>

              {trendData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-slate-500">
                  No trend data yet.
                </div>
              ) : (
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
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Category Distribution
              </h2>

              {categoryData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-slate-500">
                  No category data yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {categoryData.map((category, index) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />

                        <span className="font-semibold text-slate-900">
                          {category.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="text-lg font-bold text-slate-900">
                          {category.value} influencers
                        </span>

                        <span className="text-sm font-semibold text-purple-600 min-w-[50px] text-right">
                          {category.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Influencer Leaderboard
            </h2>

            <p className="text-sm text-slate-600 mb-6">
              Ranked by Grade Score
            </p>

            {leaderboard.length === 0 ? (
              <div className="text-slate-500">No leaderboard data yet.</div>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((influencer, index) => (
                  <div
                    key={influencer.id}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>

                    <img
                      src={influencer.photo}
                      alt={influencer.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          '/default-profile.png';
                      }}
                      className="w-16 h-16 rounded-xl object-cover"
                    />

                    <div className="flex-1">
                      <button
                        onClick={() => setSelectedInfluencer(influencer)}
                        className="font-bold text-slate-900 hover:text-purple-600 transition-colors text-left"
                      >
                        {influencer.name}
                      </button>

                      <p className="text-sm text-slate-600">
                        {formatFollowers(influencer.followers)} followers
                      </p>
                    </div>

                    <div className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {normalizeCategory(influencer.category)}
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatGradeScore(influencer)}
                      </div>
                      <div className="text-xs text-slate-600">Grade Score</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <div className="mt-8">
            <CompareInfluencers />
          </div>

          {selectedInfluencer && (
            <InfluencerProfileModal
              influencer={selectedInfluencer}
              onClose={() => setSelectedInfluencer(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
