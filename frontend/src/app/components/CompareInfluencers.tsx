import { useMemo, useState } from 'react';
import { Search, GitCompare } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { compareInfluencers } from '../../api/insight';
import { Influencer } from '../types';

type CompareResult = {
  influencer_id?: number;
  username?: string;
  full_name?: string;
  followers_count?: number;
  posts_count?: number;
  category?: string;
  primary_category?: string;
  grade_score?: number;
  style_keywords_text?: string;
  similarity_score?: number;
  selection_count?: number;
};

function normalizeCategory(category?: string | null): string {
  const aliasMap: Record<string, string> = {
    푸드맛집: '푸드·맛집',
    헬스웰니스: '헬스·웰니스',
    육아가족: '육아·가족',
  };

  if (!category) return '기타';

  return aliasMap[category] || category;
}

export function CompareInfluencers() {
  const { influencers } = useInfluencers();

  const [firstInfluencerId, setFirstInfluencerId] = useState('');
  const [secondInfluencerId, setSecondInfluencerId] = useState('');

  const [firstSearch, setFirstSearch] = useState('');
  const [secondSearch, setSecondSearch] = useState('');

  const [compareResult, setCompareResult] = useState<CompareResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedFirstInfluencer = useMemo(() => {
    return influencers.find((inf) => String(inf.id) === firstInfluencerId);
  }, [influencers, firstInfluencerId]);

  const selectedSecondInfluencer = useMemo(() => {
    return influencers.find((inf) => String(inf.id) === secondInfluencerId);
  }, [influencers, secondInfluencerId]);

  const filteredFirstInfluencers = useMemo(() => {
    const keyword = firstSearch.trim().toLowerCase();

    if (!keyword) return influencers;

    return influencers.filter((inf) => {
      const name = inf.name?.toLowerCase() || '';
      const username = inf.username?.toLowerCase() || '';

      return name.includes(keyword) || username.includes(keyword);
    });
  }, [influencers, firstSearch]);

  const filteredSecondInfluencers = useMemo(() => {
    const keyword = secondSearch.trim().toLowerCase();

    if (!keyword) return influencers;

    return influencers.filter((inf) => {
      const name = inf.name?.toLowerCase() || '';
      const username = inf.username?.toLowerCase() || '';

      return name.includes(keyword) || username.includes(keyword);
    });
  }, [influencers, secondSearch]);

  const findInfluencerFromContext = (
    item: CompareResult
  ): Influencer | undefined => {
    if (item.influencer_id !== undefined) {
      return influencers.find(
        (inf) => String(inf.id) === String(item.influencer_id)
      );
    }

    if (item.username) {
      return influencers.find((inf) => inf.username === item.username);
    }

    return undefined;
  };

  const getDisplayName = (item: CompareResult) => {
    const matchedInfluencer = findInfluencerFromContext(item);

    return (
      matchedInfluencer?.name ||
      item.full_name ||
      item.username ||
      'Unknown'
    );
  };

  const getDisplayCategory = (item: CompareResult) => {
    const matchedInfluencer = findInfluencerFromContext(item);

    return normalizeCategory(
      matchedInfluencer?.category ||
        item.primary_category ||
        item.category ||
        null
    );
  };

  const getDisplayFollowers = (item: CompareResult) => {
    const matchedInfluencer = findInfluencerFromContext(item);

    return matchedInfluencer?.followers ?? item.followers_count ?? 0;
  };

  const getDisplayPhoto = (item: CompareResult) => {
    const matchedInfluencer = findInfluencerFromContext(item);

    return matchedInfluencer?.photo || '/default-profile.png';
  };

  const handleSelectFirst = (id: string) => {
    const selected = influencers.find((inf) => String(inf.id) === id);

    setFirstInfluencerId(id);
    setFirstSearch(selected?.name || '');
  };

  const handleSelectSecond = (id: string) => {
    const selected = influencers.find((inf) => String(inf.id) === id);

    setSecondInfluencerId(id);
    setSecondSearch(selected?.name || '');
  };

  const handleCompare = async () => {
    if (!firstInfluencerId || !secondInfluencerId) {
      alert('비교할 인플루언서 2명을 선택해주세요.');
      return;
    }

    if (firstInfluencerId === secondInfluencerId) {
      alert('서로 다른 인플루언서를 선택해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      const data = await compareInfluencers(
        Number(firstInfluencerId),
        Number(secondInfluencerId)
      );

      setCompareResult(data);
    } catch (error) {
      console.error('인플루언서 비교 실패:', error);
      alert('인플루언서 비교에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
            <GitCompare className="w-5 h-5 text-purple-600" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Influencer Comparison
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start mb-6">
        <div className="min-w-0">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Influencer
          </label>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <input
              type="text"
              value={firstSearch}
              onChange={(e) => {
                setFirstSearch(e.target.value);
                setFirstInfluencerId('');
              }}
              placeholder="Search by full name or username"
              className="w-full min-w-0 pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto overflow-x-hidden border border-slate-200 rounded-xl">
            {filteredFirstInfluencers.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                검색 결과가 없습니다.
              </div>
            ) : (
              filteredFirstInfluencers.map((influencer) => {
                const id = String(influencer.id);
                const isSelected = firstInfluencerId === id;

                return (
                  <button
                    key={influencer.id}
                    type="button"
                    onClick={() => handleSelectFirst(id)}
                    className={`w-full min-w-0 flex items-center gap-3 p-3 text-left transition ${
                      isSelected
                        ? 'bg-purple-50 text-purple-700'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={influencer.photo}
                      alt={influencer.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          '/default-profile.png';
                      }}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">
                        {influencer.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        @{influencer.username} ·{' '}
                        {normalizeCategory(influencer.category)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Influencer
          </label>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <input
              type="text"
              value={secondSearch}
              onChange={(e) => {
                setSecondSearch(e.target.value);
                setSecondInfluencerId('');
              }}
              placeholder="Search by full name or username"
              className="w-full min-w-0 pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto overflow-x-hidden border border-slate-200 rounded-xl">
            {filteredSecondInfluencers.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                검색 결과가 없습니다.
              </div>
            ) : (
              filteredSecondInfluencers.map((influencer) => {
                const id = String(influencer.id);
                const isSelected = secondInfluencerId === id;

                return (
                  <button
                    key={influencer.id}
                    type="button"
                    onClick={() => handleSelectSecond(id)}
                    className={`w-full min-w-0 flex items-center gap-3 p-3 text-left transition ${
                      isSelected
                        ? 'bg-purple-50 text-purple-700'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={influencer.photo}
                      alt={influencer.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          '/default-profile.png';
                      }}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">
                        {influencer.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        @{influencer.username} ·{' '}
                        {normalizeCategory(influencer.category)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={handleCompare}
          disabled={isLoading || !firstInfluencerId || !secondInfluencerId}
          className={`px-8 py-3 rounded-xl font-semibold transition ${
            isLoading || !firstInfluencerId || !secondInfluencerId
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isLoading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {selectedFirstInfluencer && selectedSecondInfluencer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="min-w-0 rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500 mb-1">Selected A</div>
            <div className="font-bold text-slate-900 truncate">
              {selectedFirstInfluencer.name}
            </div>
            <div className="text-sm text-slate-600 truncate">
              @{selectedFirstInfluencer.username} ·{' '}
              {normalizeCategory(selectedFirstInfluencer.category)}
            </div>
          </div>

          <div className="min-w-0 rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500 mb-1">Selected B</div>
            <div className="font-bold text-slate-900 truncate">
              {selectedSecondInfluencer.name}
            </div>
            <div className="text-sm text-slate-600 truncate">
              @{selectedSecondInfluencer.username} ·{' '}
              {normalizeCategory(selectedSecondInfluencer.category)}
            </div>
          </div>
        </div>
      )}

      {compareResult.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {compareResult.map((item) => {
            const displayName = getDisplayName(item);
            const displayCategory = getDisplayCategory(item);
            const displayFollowers = getDisplayFollowers(item);
            const displayPhoto = getDisplayPhoto(item);

            return (
              <div
                key={item.influencer_id || item.username}
                className="min-w-0 rounded-2xl border border-slate-200 p-5 bg-slate-50"
              >
                <div className="flex items-center gap-4 mb-4 min-w-0">
                  <img
                    src={displayPhoto}
                    alt={displayName}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        '/default-profile.png';
                    }}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {displayName}
                    </h3>

                    {item.username && (
                      <p className="text-sm text-slate-500 truncate">
                        @{item.username}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 shrink-0">Followers</span>
                    <span className="font-semibold text-slate-900 text-right truncate">
                      {displayFollowers.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 shrink-0">Posts</span>
                    <span className="font-semibold text-slate-900 text-right truncate">
                      {(item.posts_count || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 shrink-0">Category</span>
                    <span className="font-semibold text-slate-900 text-right truncate">
                      {displayCategory}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 shrink-0">Grade Score</span>
                    <span className="font-semibold text-slate-900 text-right truncate">
                      {item.grade_score ?? '-'}
                    </span>
                  </div>

                  {item.similarity_score !== undefined && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500 shrink-0">
                        Similarity
                      </span>
                      <span className="font-semibold text-purple-600 text-right truncate">
                        {(item.similarity_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {item.style_keywords_text && (
                    <div>
                      <div className="text-slate-500 mb-1">
                        Style Keywords
                      </div>
                      <div className="text-slate-700 bg-white rounded-lg p-3 break-words">
                        {item.style_keywords_text}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
