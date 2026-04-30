import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Heart, Star } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { FilterState, Category, Influencer } from '../types';
import { InfluencerProfileModal } from './InfluencerProfileModal';
import { getCategories } from '../../api/category';
import { toggleFavorite, getFavorites } from '../../api/favorite';

function extractKeywords(text: string): string[] {
  if (!text) return [];

  const stopWords = [
    '은', '는', '이', '가', '을', '를', '에', '에서', '과', '와',
    '하고', '의', '도', '만', '에게', '한', '어울리는', '맞는', '좋은'
  ];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2)
    .filter(word => !stopWords.includes(word));

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
  const [starIds, setStarIds] = useState<string[]>([]);

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
        setCategories(data);
      })
      .catch(console.error);
  }, []);

  const filteredInfluencers = useMemo(() => {
    return influencers.filter((influencer) => {
      if (filters.search) {
        const searchKeywords = extractKeywords(filters.search);

        const nameMatch =
          influencer.name.toLowerCase().includes(filters.search.toLowerCase());

        const keywordMatch =
          searchKeywords.length > 0 &&
          searchKeywords.some(keyword =>
            influencer.styleKeywords.some(styleKeyword =>
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
      alert('관심 등록/해제에 실패했습니다.');
    }
  };

  const handleStarClick = (
    influencerId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    setStarIds((prev) =>
      prev.includes(influencerId)
        ? prev.filter((id) => id !== influencerId)
        : [...prev, influencerId]
    );
  };

  return (
    <div>
      {/* HEADER */}
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold">Discover Influencers</h1>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />

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
              className="w-full pl-12 pr-4 py-3 border rounded-xl"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 border rounded-xl flex items-center gap-2"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <AnimatePresence>
        {showFilters && (
          <motion.div>
            <div className="bg-white p-6 rounded-2xl border">
              <div className="mb-6">
                <label className="font-semibold block mb-3">
                  Number of Followers
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '500 - 1K', value: '500-1000' },
                    { label: '1K - 2K', value: '1000-2000' },
                    { label: '2K - 3K', value: '2000-3000' },
                    { label: '3K - 5K', value: '3000-5000' },
                    { label: '5K+', value: '5000+' },
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
                      className={`px-4 py-2 rounded-lg ${
                        filters.followerRange === range.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-3">
                  Category
                </label>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-2 rounded-lg ${
                        filters.categories.includes(category)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredInfluencers.map((influencer) => {
          const isFavorite = favoriteIds.includes(influencer.id);
          const isStarred = starIds.includes(influencer.id);

          return (
            <div
              key={influencer.id}
              onClick={() => handleCardClick(influencer.id)}
              className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
            >
              <div className="w-full h-64 overflow-hidden relative">
                <img
                  src={influencer.photo}
                  alt={influencer.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      '/default-profile.png';
                  }}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={(e) => handleFavoriteClick(influencer.id, e)}
                    className="bg-white rounded-full p-2 shadow hover:bg-red-50"
                    title="좋아요"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isFavorite
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>

                  <button
                    onClick={(e) => handleStarClick(influencer.id, e)}
                    className="bg-white rounded-full p-2 shadow hover:bg-yellow-50"
                    title="별표"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        isStarred
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div
                  onClick={(e) => handleNameClick(influencer, e)}
                  className="font-bold text-lg hover:text-purple-600"
                >
                  {influencer.name}
                </div>

                <div className="text-sm text-gray-500">
                  {influencer.followers.toLocaleString()} followers
                </div>

                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs">
                  {influencer.category}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
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
