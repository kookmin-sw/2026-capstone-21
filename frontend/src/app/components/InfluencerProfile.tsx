import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { FilterState, Category, FollowerRange, Influencer } from '../types';
import { InfluencerProfileModal } from './InfluencerProfileModal';

const categories: Category[] = ['패션', '뷰티', '인테리어', '리빙', '푸드·맛집', '여행', '헬스·웰니스', '육아·가족', '반려동물', '라이프스타일'];
const followerRanges: { value: FollowerRange; label: string }[] = [
  { value: '500-1000', label: '500 - 1K' },
  { value: '1000-2000', label: '1K - 2K' },
  { value: '2000-3000', label: '2K - 3K' },
  { value: '3000-5000', label: '3K - 5K' },
  { value: '5000+', label: '5K+' },
];

// 키워드 추출 함수
function extractKeywords(text: string): string[] {
  if (!text) return [];

  // 불용어 제거 (조사, 어미 등)
  const stopWords = ['은', '는', '이', '가', '을', '를', '에', '에서', '과', '와', '하고', '의', '도', '만', '에게', '한', '어울리는', '맞는', '좋은'];

  // 공백과 특수문자로 분리
  const words = text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2)
    .filter(word => !stopWords.includes(word));

  // 숫자+단위 패턴 추출 (예: 1인용 -> 1인용)
  const patterns = text.match(/\d+인용/g) || [];

  return [...new Set([...words, ...patterns])];
}

export function InfluencerProfile() {
  const { influencers, interestList, toggleInterest, selectInfluencer } = useInfluencers();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<{ influencer: Influencer; rank: number } | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    followerRange: null,
    categories: [],
    mainGender: null,
    mainAges: [],
  });

  const filteredInfluencers = useMemo(() => {
    return influencers.filter((influencer) => {
      // Search filter - 키워드 추출 및 매칭
      if (filters.search) {
        const searchKeywords = extractKeywords(filters.search);

        // 이름으로 검색
        const nameMatch = influencer.name.toLowerCase().includes(filters.search.toLowerCase());

        // styleKeywords로 검색
        const keywordMatch = searchKeywords.length > 0 && searchKeywords.some(keyword =>
          influencer.styleKeywords.some(styleKeyword =>
            styleKeyword.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        if (!nameMatch && !keywordMatch) {
          return false;
        }
      }

      // Follower range filter
      if (filters.followerRange) {
        const followers = influencer.followers;
        switch (filters.followerRange) {
          case '500-1000':
            if (followers < 500 || followers > 1000) return false;
            break;
          case '1000-2000':
            if (followers < 1000 || followers > 2000) return false;
            break;
          case '2000-3000':
            if (followers < 2000 || followers > 3000) return false;
            break;
          case '3000-5000':
            if (followers < 3000 || followers > 5000) return false;
            break;
          case '5000+':
            if (followers < 5000) return false;
            break;
        }
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(influencer.category)) {
        return false;
      }

      return true;
    });
  }, [influencers, filters]);

  const toggleCategory = (category: Category) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const sortedInfluencers = useMemo(() => {
    return [...influencers].sort((a, b) => b.selections - a.selections);
  }, [influencers]);

  const getRank = (influencerId: string) => {
    return sortedInfluencers.findIndex((inf) => inf.id === influencerId) + 1;
  };

  const handleCardClick = (influencerId: string) => {
    selectInfluencer(influencerId);
  };

  const handleNameClick = (influencer: Influencer, e: React.MouseEvent) => {
    e.stopPropagation();
    const rank = getRank(influencer.id);
    setSelectedInfluencer({ influencer, rank });
  };

  return (
    <div>
      {/* Header with Search and Filters */}
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Discover Influencers</h1>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search influencers..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
              showFilters
                ? 'bg-gradient-to-r from-green-500 to-purple-500 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              {/* Follower Range */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Number of Followers</label>
                <div className="flex flex-wrap gap-2">
                  {followerRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          followerRange: prev.followerRange === range.value ? null : range.value,
                        }))
                      }
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filters.followerRange === range.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Category (Multi-select)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                        filters.categories.includes(category)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(filters.followerRange || filters.categories.length > 0) && (
                <button
                  onClick={() =>
                    setFilters({
                      search: filters.search,
                      followerRange: null,
                      categories: [],
                      mainGender: null,
                      mainAges: [],
                    })
                  }
                  className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-slate-600">
          Showing <span className="font-semibold text-slate-900">{filteredInfluencers.length}</span> influencers
        </p>
      </div>

      {/* Influencer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredInfluencers.map((influencer) => (
          <motion.div
            key={influencer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleCardClick(influencer.id)}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
          >
            {/* Photo - 70% */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={influencer.photo}
                alt={influencer.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Star Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleInterest(influencer.id);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all"
              >
                <Star
                  className={`w-5 h-5 ${
                    interestList.includes(influencer.id)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            </div>

            {/* Info - 30% */}
            <div className="p-4 space-y-2">
              <button
                onClick={(e) => handleNameClick(influencer, e)}
                className="font-bold text-lg text-slate-900 hover:text-purple-600 transition-colors text-left w-full"
              >
                {influencer.name}
              </button>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {influencer.followers >= 1000
                    ? `${(influencer.followers / 1000).toFixed(1)}K`
                    : influencer.followers}{' '}
                  followers
                </span>
              </div>
              <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold capitalize">
                {influencer.category}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredInfluencers.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No influencers found</h3>
        </div>
      )}

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
