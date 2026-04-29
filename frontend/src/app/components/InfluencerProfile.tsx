import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { FilterState, Category, Influencer } from '../types';
import { getCategories } from '../../api/category';

// follower range 유지
const followerRanges = [
  { value: '500-1000', label: '500 - 1K' },
  { value: '1000-2000', label: '1K - 2K' },
  { value: '2000-3000', label: '2K - 3K' },
  { value: '3000-5000', label: '3K - 5K' },
  { value: '5000+', label: '5K+' },
];

// keyword function 유지
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
};

export function InfluencerProfile() {
  const { influencers, selectInfluencer } = useInfluencers();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<{
    influencer: Influencer;
    rank: number;
  } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    followerRange: null,
    categories: [],
    mainGender: null,
    mainAges: [],
  });

  /* =========================
     1. CATEGORY API FIX (수정됨)
  ========================= */
  useEffect(() => {
    getCategories()
      .then((data) => {
        // ✅ 수정: map 제거 (백엔드 그대로 사용)
        setCategories(data);
      })
      .catch(console.error);
  }, []);

  /* =========================
     2. FILTER LOGIC (수정됨)
     influencer.category → influencer.primary_category
  ========================= */
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

      /* ⭐ 수정 핵심 */
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(influencer.primary_category as any)
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

  return (
    <div>
      {/* Header */}
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
            className="px-6 py-3 border rounded-xl"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div>
            <div className="bg-white p-6 rounded-2xl border">

              {/* CATEGORY (FIXED) */}
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

      {/* LIST */}
      <div className="grid grid-cols-4 gap-6">
        {filteredInfluencers.map((influencer) => (
          <div
            key={influencer.id}
            onClick={() => handleCardClick(influencer.id)}
            className="cursor-pointer"
          >
            <img src={influencer.photo} />

            <div onClick={(e) => handleNameClick(influencer, e)}>
              {influencer.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
