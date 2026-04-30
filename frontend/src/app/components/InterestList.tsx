import { useEffect, useMemo, useState } from 'react';
import { Heart, LayoutGrid, List as ListIcon, FileText } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { Category, Influencer } from '../types';
import { InfluencerProfileModal } from './InfluencerProfileModal';
import {
  getFavorites,
  deleteFavorite,
  updateFavoriteMemo,
} from '../../api/favorite';

type FavoriteItem = {
  influencer_id: number;
  reason?: string;
};

export function InterestList() {
  const { influencers } = useInfluencers();

  const [organizeByCategory, setOrganizeByCategory] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<{
    influencer: Influencer;
    rank: number;
  } | null>(null);

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [memoTexts, setMemoTexts] = useState<Record<number, string>>({});
  const [editingMemoId, setEditingMemoId] = useState<number | null>(null);

  useEffect(() => {
    getFavorites()
      .then((data) => {
        setFavorites(data);

        const initialMemos: Record<number, string> = {};
        data.forEach((fav: FavoriteItem) => {
          initialMemos[fav.influencer_id] = fav.reason || '';
        });

        setMemoTexts(initialMemos);
      })
      .catch(console.error);
  }, []);

  const interestedInfluencers = useMemo(() => {
    return influencers.filter((inf) =>
      favorites.some((fav) => fav.influencer_id === Number(inf.id))
    );
  }, [influencers, favorites]);

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

    setSelectedInfluencer({
      influencer,
      rank: getRank(influencer.id),
    });
  };

  const handleDeleteFavorite = async (influencerId: string) => {
    try {
      await deleteFavorite(Number(influencerId));

      setFavorites((prev) =>
        prev.filter((fav) => fav.influencer_id !== Number(influencerId))
      );
    } catch (error) {
      console.error(error);
      alert('관심 삭제에 실패했습니다.');
    }
  };

  const handleSaveMemo = async (influencerId: string) => {
    const id = Number(influencerId);
    const reason = memoTexts[id] || '';

    try {
      await updateFavoriteMemo(id, reason);

      setFavorites((prev) =>
        prev.map((fav) =>
          fav.influencer_id === id ? { ...fav, reason } : fav
        )
      );

      setEditingMemoId(null);
    } catch (error) {
      console.error(error);
      alert('메모 저장에 실패했습니다.');
    }
  };

  const renderInfluencerCard = (influencer: Influencer) => {
    const id = Number(influencer.id);

    return (
      <div
        key={influencer.id}
        className="bg-white rounded-xl overflow-hidden shadow"
      >
        <img
          src={influencer.photo}
          alt={influencer.name}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/default-profile.png';
          }}
          className="w-full aspect-[3/4] object-cover"
        />

        <div className="p-4">
          <button
            onClick={(e) => handleNameClick(influencer, e)}
            className="font-bold hover:text-purple-600"
          >
            {influencer.name}
          </button>

          <div className="text-sm text-gray-500">
            {influencer.followers.toLocaleString()} followers
          </div>

          <div className="text-xs text-purple-600 mt-1">
            {influencer.category}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => handleDeleteFavorite(influencer.id)}
              className="text-yellow-500"
              title="관심 해제"
            >
              ★
            </button>

            <button
              onClick={() => setEditingMemoId(id)}
              className="inline-flex items-center gap-1 text-sm text-gray-600"
            >
              <FileText className="w-4 h-4" />
              메모
            </button>
          </div>

          {editingMemoId === id && (
            <div className="mt-2">
              <textarea
                value={memoTexts[id] || ''}
                onChange={(e) =>
                  setMemoTexts((prev) => ({
                    ...prev,
                    [id]: e.target.value,
                  }))
                }
                placeholder="메모를 입력하세요"
                className="w-full border p-2 rounded text-sm"
              />

              <button
                onClick={() => handleSaveMemo(influencer.id)}
                className="mt-2 px-3 py-1 bg-purple-500 text-white rounded text-sm"
              >
                저장
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
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

      {interestedInfluencers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Heart className="w-12 h-12 text-purple-500" />
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            No Influencers Yet
          </h3>

          <p className="text-slate-600 mb-6">
            Save influencers you like
          </p>
        </div>
      ) : organizeByCategory ? (
        <div className="space-y-10">
          {Object.entries(groupedByCategory)
            .filter(([_, list]) => list.length > 0)
            .map(([category, list]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-4">{category}</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {list.map((influencer) => renderInfluencerCard(influencer))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {interestedInfluencers.map((influencer) =>
            renderInfluencerCard(influencer)
          )}
        </div>
      )}

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
