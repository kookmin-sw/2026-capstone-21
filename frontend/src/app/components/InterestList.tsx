import { useMemo, useState } from 'react';
import {
  Heart,
  LayoutGrid,
  List as ListIcon,
  FileText,
  Star,
} from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { Influencer } from '../types';
import { InfluencerProfileModal } from './InfluencerProfileModal';
import { createUserActionLog } from '../../api/userActionLog';

const CATEGORY_ORDER = [
  '패션',
  '뷰티',
  '인테리어',
  '리빙',
  '푸드·맛집',
  '여행',
  '헬스·웰니스',
  '육아·가족',
  '반려동물',
  '라이프스타일',
  '기타',
];

function normalizeCategory(category?: string | null): string {
  const aliasMap: Record<string, string> = {
    푸드맛집: '푸드·맛집',
    헬스웰니스: '헬스·웰니스',
    육아가족: '육아·가족',
  };

  if (!category) return '기타';

  return aliasMap[category] || category;
}

function getLoginUserId(): number | null {
  const storedUserId = localStorage.getItem('user_id');

  if (!storedUserId) {
    return null;
  }

  const userId = Number(storedUserId);

  if (Number.isNaN(userId)) {
    return null;
  }

  return userId;
}

export function InterestList() {
  const {
    influencers,
    interestList,
    notes,
    toggleInterest,
    saveNote,
  } = useInfluencers();

  const [organizeByCategory, setOrganizeByCategory] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] =
    useState<Influencer | null>(null);

  const [memoTexts, setMemoTexts] = useState<Record<string, string>>({});
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);

  const interestedInfluencers = useMemo(() => {
    return [...interestList]   
      .reverse()               
      .map((id) =>
        influencers.find((inf) => String(inf.id) === String(id))
      )
      .filter((inf): inf is Influencer => Boolean(inf));
  }, [influencers, interestList]);

  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, Influencer[]> = {};

    CATEGORY_ORDER.forEach((category) => {
      grouped[category] = [];
    });

    interestedInfluencers.forEach((inf) => {
      const category = normalizeCategory(inf.category);

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push(inf);
    });

    return grouped;
  }, [interestedInfluencers]);

  const handleNameClick = async (
    influencer: Influencer,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    const userId = getLoginUserId();

    if (userId) {
      try {
        await createUserActionLog({
          user_id: userId,
          influencer_id: Number(influencer.id),
          action_type: 'detail_view',
        });
      } catch (error) {
        console.error('detail_view 로그 저장 실패:', error);
      }
    }

    setSelectedInfluencer(influencer);
  };

  const handleDeleteFavorite = async (influencerId: string) => {
    try {
      await toggleInterest(String(influencerId));

      const userId = getLoginUserId();

      if (userId) {
        try {
          await createUserActionLog({
            user_id: userId,
            influencer_id: Number(influencerId),
            action_type: 'favorite_remove',
          });
        } catch (logError) {
          console.error('favorite_remove 로그 저장 실패:', logError);
        }
      }

      if (editingMemoId === String(influencerId)) {
        setEditingMemoId(null);
      }

      setMemoTexts((prev) => {
        const next = { ...prev };
        delete next[String(influencerId)];
        return next;
      });
    } catch (error) {
      console.error(error);
      alert('관심 삭제에 실패했습니다.');
    }
  };

  const handleMemoClick = (influencerId: string) => {
    const id = String(influencerId);

    setMemoTexts((prev) => ({
      ...prev,
      [id]: prev[id] ?? notes[id] ?? '',
    }));

    setEditingMemoId(id);
  };

  const handleSaveMemo = async (influencerId: string) => {
    const id = String(influencerId);
    const reason = memoTexts[id] ?? '';

    try {
      await saveNote(id, reason);
      setEditingMemoId(null);
    } catch (error) {
      console.error(error);
      alert('메모 저장에 실패했습니다.');
    }
  };

  const renderInfluencerCard = (influencer: Influencer) => {
    const id = String(influencer.id);
    const currentMemoText = memoTexts[id] ?? notes[id] ?? '';

    return (
      <div
        key={influencer.id}
        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden border border-slate-100"
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
            onClick={() => handleDeleteFavorite(id)}
            className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-md hover:bg-yellow-50 transition"
            title="관심 해제"
          >
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={(e) => handleNameClick(influencer, e)}
            className="font-bold text-xl text-slate-900 hover:text-purple-600 transition text-left"
          >
            {influencer.name}
          </button>

          <div className="text-slate-600">
            {influencer.followers.toLocaleString()} followers
          </div>

          <div className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
            {normalizeCategory(influencer.category)}
          </div>

          <button
            onClick={() => handleMemoClick(id)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-purple-600 transition"
          >
            <FileText className="w-4 h-4" />
            메모
          </button>

          {notes[id] && editingMemoId !== id && (
            <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 line-clamp-3">
              {notes[id]}
            </p>
          )}

          {editingMemoId === id && (
            <div className="space-y-2">
              <textarea
                value={currentMemoText}
                onChange={(e) =>
                  setMemoTexts((prev) => ({
                    ...prev,
                    [id]: e.target.value,
                  }))
                }
                placeholder="메모를 입력하세요"
                className="w-full min-h-24 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveMemo(id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
                >
                  저장
                </button>

                <button
                  onClick={() => setEditingMemoId(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300"
                >
                  취소
                </button>
              </div>
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Picks</h1>

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

          <p className="text-slate-600 mb-6">Save influencers you like</p>
        </div>
      ) : organizeByCategory ? (
        <div className="space-y-10">
          {Object.entries(groupedByCategory)
            .filter(([_, list]) => list.length > 0)
            .map(([category, list]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  {category}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                  {list.map((influencer) => renderInfluencerCard(influencer))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
          {interestedInfluencers.map((influencer) =>
            renderInfluencerCard(influencer)
          )}
        </div>
      )}

      {selectedInfluencer && (
        <InfluencerProfileModal
          influencer={selectedInfluencer}
          onClose={() => setSelectedInfluencer(null)}
        />
      )}
    </div>
  );
}