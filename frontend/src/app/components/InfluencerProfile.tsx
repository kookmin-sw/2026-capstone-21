import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Star } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { FilterState, Category, Influencer } from '../types';
import { InfluencerProfileModal } from './InfluencerProfileModal';
import { getCategories } from '../../api/category';
import { createMallInput } from '../../api/mallInput';
import { getPrediction } from '../../api/recommendation';
import { createUserActionLog } from '../../api/userActionLog';

function extractKeywords(text: string): string[] {
  if (!text) return [];

  const stopWords = [
    '은',
    '는',
    '이',
    '가',
    '을',
    '를',
    '에',
    '에서',
    '과',
    '와',
    '하고',
    '의',
    '도',
    '만',
    '에게',
    '한',
    '어울리는',
    '맞는',
    '좋은',
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
  const { influencers, interestList, toggleInterest, selectInfluencer } =
    useInfluencers();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const [showFilters, setShowFilters] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] =
    useState<Influencer | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [runId, setRunId] = useState<number | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    followerRange: null,
    categories: [],
    mainGender: null,
    mainAges: [],
  });

  const [recommendText, setRecommendText] = useState('');
  const [recommendResults, setRecommendResults] = useState<Influencer[]>([]);
  const [recommendScores, setRecommendScores] = useState<Record<string, number>>({});
  const [isRecommending, setIsRecommending] = useState(false);
  const [recCategory, setRecCategory] = useState<string>('');
  const [recFollowerRange, setRecFollowerRange] = useState<string>('');
  const [showReasons, setShowReasons] = useState(false);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  // 필터가 바뀔 때마다 페이지를 1로 리셋하기 위한 로직
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, recommendResults]);
  
  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data as Category[]);
      })
      .catch(console.error);
  }, []);

  const saveActionLog = async (
    influencerId: string,
    actionType: 'detail_view' | 'favorite_add' | 'favorite_remove'
  ) => {
    const userId = localStorage.getItem('user_id');

    if (!userId) return;

    console.log('행동로그 전송:', {
      user_id: Number(userId),
      influencer_id: Number(influencerId),
      action_type: actionType,
      run_id: runId,
    });

    await createUserActionLog({
      user_id: Number(userId),
      influencer_id: Number(influencerId),
      action_type: actionType,
      run_id: runId,
    });
  };

  const handleRecommend = async () => {
    try {
      const userId = localStorage.getItem('user_id');

      if (!userId) {
        alert('로그인이 필요합니다');
        return;
      }

      if (!recommendText.trim()) {
        alert('브랜드 설명을 입력해주세요.');
        return;
      }

      setIsRecommending(true);

      const mallInput = await createMallInput({
        user_id: Number(userId),
        input_text: recommendText,
      });

      console.log('mall_input 저장 응답:', mallInput);

      const followerMinMap: Record<string, number> = {
        '500-1000': 500,
        '1000-2000': 1000,
        '2000-3000': 2000,
        '3000-5000': 3000,
        '5000+': 5000,
      };

      const res = await getPrediction(
        Number(mallInput.input_id),
        Number(userId),
        {
          category: recCategory || undefined,
          minFollowers: recFollowerRange ? followerMinMap[recFollowerRange] : undefined,
        }
      );

      console.log('추천 API 응답:', res);
      console.log('추천 run_id:', res.run_id);

      setRunId(res.run_id ?? null);

      const sortedRecommendations = [...(res.recommendations || [])].sort(
        (a: any, b: any) => {
          if (a.rank_no != null && b.rank_no != null) {
            return a.rank_no - b.rank_no;
          }

          if (a.final_score != null && b.final_score != null) {
            return b.final_score - a.final_score;
          }

          return (
            Number(a.influencer_id ?? a.id ?? 0) -
            Number(b.influencer_id ?? b.id ?? 0)
          );
        }
      );

      const mappedResults: Influencer[] = sortedRecommendations.map(
        (item: any) => {
          const id = String(item.id ?? item.influencer_id);

          const matchedInfluencer = influencers.find(
            (influencer) => String(influencer.id) === id
          );

          if (matchedInfluencer) {
            return matchedInfluencer;
          }

          return {
            id,
            name: item.name ?? item.full_name ?? item.username ?? '이름 없음',
            photo: item.profile_pic_url || item.photo || `/profile_pic_HD/${item.username}.jpg`,
            followers: item.followers ?? item.followers_count ?? 0,
            category:
              item.category ??
              item.primary_category ??
              item.category_name ??
              '기타',
            mainGender: item.mainGender ?? 'both',
            mainAge: item.mainAge ?? '25-34',
            selections: item.selections ?? 0,
            gradeScore: item.gradeScore ?? item.grade_score ?? 0,
            instagram: item.instagram ?? item.username ?? '',
            styleKeywords: item.styleKeywords ?? item.style_keywords ?? [],
          };
        }
      );

      setRecommendResults(mappedResults);

      // 점수 매핑 저장
      const scores: Record<string, number> = {};
      sortedRecommendations.forEach((item: any) => {
        const id = String(item.id ?? item.influencer_id);
        scores[id] = item.score ?? item.final_score ?? 0;
      });
      setRecommendScores(scores);
    } catch (err) {
      console.error(err);
      alert('추천 실패');
    } finally {
      setIsRecommending(false);
    }
  };

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

  const displayedInfluencers = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    return filteredInfluencers.slice(0, lastIndex);
  }, [filteredInfluencers, currentPage]);

  const toggleCategory = (category: Category) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleCardClick = async (id: string) => {
    console.log('카드 클릭됨:', id, '현재 runId:', runId);

    const influencer =
      influencers.find((inf) => String(inf.id) === id) ||
      recommendResults.find((inf) => String(inf.id) === id);

    selectInfluencer(id);

    try {
      await saveActionLog(id, 'detail_view');
      console.log('detail_view 저장 성공');
    } catch (error) {
      console.error('detail_view 로그 저장 실패:', error);
    }

    if (influencer) {
      setSelectedInfluencer(influencer);
    }
  };

  const handleNameClick = async (
    influencer: Influencer,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    console.log('이름 클릭됨:', influencer.id, '현재 runId:', runId);

    try {
      await saveActionLog(String(influencer.id), 'detail_view');
      console.log('detail_view 저장 성공');
    } catch (error) {
      console.error('detail_view 로그 저장 실패:', error);
    }

    setSelectedInfluencer(influencer);
  };

  const handleFavoriteClick = async (
    influencerId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      const result = await toggleInterest(String(influencerId));

      const actionType =
        result === 'added' ? 'favorite_add' : 'favorite_remove';

      await saveActionLog(influencerId, actionType);
    } catch (error) {
      console.error('관심 등록/해제 로그 저장 실패:', error);
      alert('관심 등록/해제에 실패했습니다. 로그인 상태를 확인해주세요.');
    }
  };

  const renderInfluencerCard = (influencer: Influencer) => {
    const influencerId = String(influencer.id);
    const isFavorite = interestList.includes(influencerId);

    return (
      <div
        key={influencer.id}
        onClick={() => handleCardClick(influencerId)}
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
            onClick={(e) => handleFavoriteClick(influencerId, e)}
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
            {Number(influencer.followers || 0).toLocaleString()} followers
          </div>

          <div className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
            {influencer.category}
          </div>

          {recommendScores[influencerId] !== undefined && (
            <div className="space-y-1">
              <div className="text-xs text-purple-600 font-semibold">
                추천 점수: {(recommendScores[influencerId] * 100).toFixed(1)}점
              </div>
              {showReasons && reasons[influencerId] && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">{reasons[influencerId]}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">
          Find Influencers
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
        {displayedInfluencers.map((influencer) =>
          renderInfluencerCard(influencer)
        )}
      </div>

      {filteredInfluencers.length > displayedInfluencers.length && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-10 py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-2xl font-bold hover:bg-purple-50 transition shadow-sm"
          >
            Load More Influencers ({displayedInfluencers.length} / {filteredInfluencers.length})
          </button>
        </div>
      )}

      {selectedInfluencer && (
        <InfluencerProfileModal
          influencer={selectedInfluencer}
          onClose={() => setSelectedInfluencer(null)}
          runId={runId}
        />
      )}
    </div>
  );
}