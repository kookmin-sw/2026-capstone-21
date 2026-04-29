import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Star, Heart, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { Category, Influencer } from '../types';
import { InfluencerProfileModal } from './InfluencerProfileModal';

import { getFavorites, toggleFavorite } from '../../api/favorite';

export function InterestList() {
  const { influencers } = useInfluencers();

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [organizeByCategory, setOrganizeByCategory] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] =
    useState<{ influencer: Influencer; rank: number } | null>(null);

  // 1. DB에서 관심 목록 가져오기
  useEffect(() => {
    getFavorites()
      .then((data) => {
        const ids = data.map((f: any) => String(f.influencer_id));
        setFavoriteIds(ids);
      })
      .catch(console.error);
  }, []);

  // 2. 관심 목록 필터링 (DB 기준)
  const interestedInfluencers = useMemo(() => {
    return influencers.filter((inf) =>
      favoriteIds.includes(inf.id)
    );
  }, [influencers, favoriteIds]);

  // 3. 카테고리 그룹화
  const groupedByCategory = useMemo(() => {
    const grouped: Record<Category, Influencer[]> = {
      패션: [],
      뷰티: [],
      인테리어: [],
      리빙: [],
      '푸드·맛집': [],
      여행: [],
      '헬스·웰니스': [],
      '육아·가족': [],
      반려동물: [],
      라이프스타일: [],
    };

    interestedInfluencers.forEach((inf) => {
      grouped[inf.category].push(inf);
    });

    return grouped;
  }, [interestedInfluencers]);

  // 4. 전체 순위 계산
  const sortedInfluencers = useMemo(() => {
    return [...influencers].sort((a, b) => b.selections - a.selections);
  }, [influencers]);

  const getRank = (influencerId: string) => {
    return sortedInfluencers.findIndex((inf) => inf.id === influencerId) + 1;
  };

  // 5. 관심 토글 (DB 반영)
  const handleToggleFavorite = async (influencerId: string) => {
    try {
      const res = await toggleFavorite(Number(influencerId));

      // 서버 응답 기준 업데이트
      if (res.status === 'added') {
        setFavoriteIds((prev) => [...prev, influencerId]);
      } else {
        setFavoriteIds((prev) =>
          prev.filter((id) => id !== influencerId)
        );
      }
    } catch (err) {
      console.error('toggle 실패:', err);
    }
  };

  const handleNameClick = (influencer: Influencer, e: React.MouseEvent) => {
    e.stopPropagation();
    const rank = getRank(influencer.id);
    setSelectedInfluencer({ influencer, rank });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            My Picks
          </h1>
          <p className="text-slate-600">
            {interestedInfluencers.length} Influencers Saved
          </p>
        </div>

        {interestedInfluencers.length > 0 && (
          <button
            onClick={() => setOrganizeByCategory(!organizeByCategory)}
            className="px-6 py-3 bg-white border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {organizeByCategory ? (
              <LayoutGrid className="w-5 h-5" />
            ) : (
              <ListIcon className="w-5 h-5" />
            )}
            {organizeByCategory ? 'Show All' : 'Filter by Category'}
          </button>
        )}
      </div>

      {/* Empty */}
      {interestedInfluencers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Heart className="w-12 h-12 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            No Influencers Yet
          </h3>
          <p className="text-slate-600 mb-6">
            Save influencers you're interested in
          </p>
        </div>
      ) : organizeByCategory ? (
        /* CATEGORY VIEW */
        <div className="space-y-10">
          {Object.entries(groupedByCategory)
            .filter(([_, list]) => list.length > 0)
            .map(([category, list]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-4">{category}</h2>

                <div className="grid grid-cols-4 gap-6">
                  {list.map((inf) => (
                    <div key={inf.id} className="bg-white rounded-xl overflow-hidden">
                      <img src={inf.photo} className="w-full aspect-[3/4] object-cover" />

                      <div className="p-4">
                        <div
                          onClick={(e) => handleNameClick(inf, e)}
                          className="font-bold cursor-pointer"
                        >
                          {inf.name}
                        </div>

                        <button
                          onClick={() => handleToggleFavorite(inf.id)}
                          className="mt-2"
                        >
                          <Star
                            className={
                              favoriteIds.includes(inf.id)
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-400'
                            }
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        /* NORMAL VIEW */
        <div className="grid grid-cols-4 gap-6">
          {interestedInfluencers.map((inf) => (
            <div key={inf.id} className="bg-white rounded-xl overflow-hidden">
              <img src={inf.photo} className="w-full aspect-[3/4] object-cover" />

              <div className="p-4">
                <div
                  onClick={(e) => handleNameClick(inf, e)}
                  className="font-bold cursor-pointer"
                >
                  {inf.name}
                </div>

                <button
                  onClick={() => handleToggleFavorite(inf.id)}
                  className="mt-2"
                >
                  <Star
                    className={
                      favoriteIds.includes(inf.id)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-400'
                    }
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
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
