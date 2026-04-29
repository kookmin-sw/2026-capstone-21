import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Star, Heart, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { Category, Influencer } from '../types';
import { InfluencerProfileModal } from './InfluencerProfileModal';
import { getFavorites } from '../../api/favorite';

type FavoriteItem = {
  influencer_id: number;
  reason?: string;
};

export function InterestList() {
  const { influencers, toggleInterest } = useInfluencers();

  const [organizeByCategory, setOrganizeByCategory] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<{ influencer: Influencer; rank: number } | null>(null);

  // ✔ DB 기반 favorite 목록
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // ✔ 1. DB에서 관심 목록 불러오기
  useEffect(() => {
    getFavorites()
      .then(setFavorites)
      .catch(console.error);
  }, []);

  // ✔ 2. influencer_id → influencer 매핑
  const interestedInfluencers = useMemo(() => {
    return influencers.filter((inf) =>
      favorites.some((fav) => fav.influencer_id === Number(inf.id))
    );
  }, [influencers, favorites]);

  // ✔ 3. 카테고리 그룹핑
  const groupedByCategory = useMemo(() => {
    const grouped: Record<Category, typeof interestedInfluencers> = {
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

  const sortedInfluencers = useMemo(() => {
    return [...influencers].sort((a, b) => b.selections - a.selections);
  }, [influencers]);

  const getRank = (influencerId: string) => {
    return sortedInfluencers.findIndex((inf) => inf.id === influencerId) + 1;
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Picks</h1>
          <p className="text-slate-600">
            {interestedInfluencers.length} Influencers Saved
          </p>
        </div>

        {interestedInfluencers.length > 0 && (
          <button
            onClick={() => setOrganizeByCategory(!organizeByCategory)}
            className="px-6 py-3 bg-white border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {organizeByCategory ? <LayoutGrid className="w-5 h-5" /> : <ListIcon className="w-5 h-5" />}
            {organizeByCategory ? 'Show All' : 'Filter by Category'}
          </button>
        )}
      </div>

      {/* Empty State */}
      {interestedInfluencers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Heart className="w-12 h-12 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No Influencers Yet</h3>
          <p className="text-slate-600 mb-6">
            Save influencers you like
          </p>
        </div>
      ) : organizeByCategory ? (
        /* Category View */
        <div className="space-y-10">
          {Object.entries(groupedByCategory)
            .filter(([_, list]) => list.length > 0)
            .map(([category, list]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-4">{category}</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {list.map((influencer) => (
                    <div key={influencer.id} className="bg-white rounded-xl overflow-hidden">
                      <img src={influencer.photo} className="w-full aspect-[3/4] object-cover" />

                      <div className="p-4">
                        <button
                          onClick={(e) => handleNameClick(influencer, e)}
                          className="font-bold hover:text-purple-600"
                        >
                          {influencer.name}
                        </button>

                        <div className="text-sm text-gray-500">
                          {influencer.followers} followers
                        </div>

                        <div className="text-xs text-purple-600 mt-1">
                          {influencer.category}
                        </div>

                        <button
                          onClick={() => toggleInterest(influencer.id)}
                          className="mt-2 text-yellow-500"
                        >
                          ★
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        /* Flat List */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {interestedInfluencers.map((influencer) => (
            <div key={influencer.id} className="bg-white rounded-xl overflow-hidden">
              <img src={influencer.photo} className="w-full aspect-[3/4] object-cover" />

              <div className="p-4">
                <button
                  onClick={(e) => handleNameClick(influencer, e)}
                  className="font-bold hover:text-purple-600"
                >
                  {influencer.name}
                </button>

                <div className="text-sm text-gray-500">
                  {influencer.followers} followers
                </div>

                <div className="text-xs text-purple-600 mt-1">
                  {influencer.category}
                </div>

                <button
                  onClick={() => toggleInterest(influencer.id)}
                  className="mt-2 text-yellow-500"
                >
                  ★
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
