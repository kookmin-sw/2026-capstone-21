import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Star } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { FilterState, Category, Influencer } from '../types';
import { InfluencerProfileModal } from './InfluencerProfileModal';
import { getCategories } from '../../api/category';
import { toggleFavorite, getFavorites } from '../../api/favorite';

function extractKeywords(text: string): string[] {
  if (!text) return [];

  const stopWords = [
    '은', '는', '이', '가', '을', '를', '에', '에서', '과', '와', '하고', '의',
    '도', '만', '에게', '한', '어울리는', '맞는', '좋은',
  ];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .filter((word) => !stopWords.includes(word));

  const patterns = text.match(/\d+인용/g) || [];

  return [...new Set([...words, ...patterns])];
}

export function InfluencerProfile() {
  const { influencers, selectInfluencer } = useInfluencers();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<{
    influencer: Influencer;
    rank: number;
  } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    followerRange: null,
    categories: [],
    mainGender: null,
    mainAges: [],
  });

  useEffect(() => {
    getFavorites()
      .then((data) => {
        const ids = data.map((fav: any) => String(fav.influencer_id));
        setFavoriteIds(ids);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data as Category[]);
      })
      .catch(console.error);
  }, []);

  const filteredInfluencers = useMemo(() => {
    return influencers.filter((influencer) => {
      if (filters.search) {
        const searchKeywords = extractKeywords(filters.search);

        const nameMatch = influencer.name
          .toLowerCase()
          .includes(filters.search.toLowerCase());

        const keywordMatch =
          searchKeywords.length > 0 &&
          searchKeywords.some((keyword) =>
            influencer.styleKeywords.some((styleKeyword) =>
              styleKeyword.toLowerCase().includes(keyword.toLowerCase())
            )
          );

        if (!nameMatch && !keywordMatch) return false;
      }

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

      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(influencer.category)
      ) {
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

  const getRank = (id: string) =>
    sortedInfluencers.findIndex((inf) => inf.id === id) + 1;

  const handleCardClick = (id: string) => {
    selectInfluencer(id);
  };

  const handleNameClick = (influencer: Influencer, e: React.MouseEvent) => {
    e.stopPropagation();

    setSelectedInfluencer({
      influencer,
      rank: getRank(influencer.id),
    });
  };

  const handleFavoriteClick = async (
    influencerId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      await toggleFavorite(Number(influencerId));

      setFavoriteIds((prev) =>
        prev.includes(influencerId)
          ? prev.filter((id) => id !== influencerId)
          : [...prev, influencerId]
      );
    } catch (error) {
      console.error(error);
      alert('관심 등록/해제에 실패했습니다. 로그인 상태를 확인해주세요.');
    }
  };

  return (
    <div>
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">
          Discover Influencers
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />

            <input
              type="text"
              placeholder="Search influencers..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className="w-full pl-14 pr-4 py-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-8 py-4 border border-slate-300 rounded-2xl bg-white flex items-center gap-3 font-semibold hover:bg-slate-50 transition"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-8"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="mb-6">
                <label className="font-semibold block mb-3">
                  Number of Followers
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '500 - 1K', value: '500-1000' as const },
                    { label: '1K - 2K', value: '1000-2000' as const },
                    { label: '2K - 3K', value: '2000-3000' as const },
                    { label: '3K - 5K', value: '3000-5000' as const },
                    { label: '5K+', value: '5000+' as const },
                  ].map((range) => (
                    <button
                      key={range.value}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          followerRange:
                            prev.followerRange === range.value
                              ? null
                              : range.value,
                        }))
                      }
                      className={`px-4 py-2 rounded-lg transition ${
                        filters.followerRange === range.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-3">Category</label>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={String(category)}
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-2 rounded-lg transition ${
                        filters.categories.includes(category)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {String(category)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
        {filteredInfluencers.map((influencer) => {
          const isFavorite = favoriteIds.includes(influencer.id);

          return (
            <div
              key={influencer.id}
              onClick={() => handleCardClick(influencer.id)}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden border border-slate-100"
            >
              <div className="w-full h-72 overflow-hidden relative bg-gradient-to-b from-slate-100 to-slate-300">
                <img
                  src={influencer.photo}
                  alt={influencer.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      '/default-profile.png';
                  }}
                  className="w-full h-full object-cover"
                />

                <button
                  onClick={(e) => handleFavoriteClick(influencer.id, e)}
                  className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-md hover:bg-yellow-50 transition"
                  title="My Picks"
                >
                  <Star
                    className={`w-6 h-6 ${
                      isFavorite
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              </div>

              <div className="p-6 space-y-3">
                <div
                  onClick={(e) => handleNameClick(influencer, e)}
                  className="font-bold text-xl text-slate-900 hover:text-purple-600 transition"
                >
                  {influencer.name}
                </div>

                <div className="text-slate-600">
                  {influencer.followers.toLocaleString()} followers
                </div>

                <div className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  {influencer.category}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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