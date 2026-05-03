import { useState } from 'react';
import { Search, Trash2, DownloadCloud } from 'lucide-react';
import {
  searchInfluencersForAdmin,
  crawlInfluencersByKeywords,
  deleteInfluencerForAdmin,
  AdminInfluencerSearchResult,
} from '../../api/admin';

function formatFollowers(followers: number) {
  if (followers >= 10000) {
    return `${(followers / 10000).toFixed(1)}만`;
  }

  if (followers >= 1000) {
    return `${(followers / 1000).toFixed(1)}K`;
  }

  return followers.toLocaleString();
}

function formatDate(date: string | null) {
  if (!date) return '-';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString('ko-KR');
}

function parseKeywords(value: string) {
  return value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function SystemConsole() {
  const [searchKeywords, setSearchKeywords] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [minPosts, setMinPosts] = useState('');
  const [lastPostDate, setLastPostDate] = useState('');

  const [maxResults, setMaxResults] = useState('');
  const [followRatio, setFollowRatio] = useState('');
  const [engagementRate, setEngagementRate] = useState('');

  const [searchResults, setSearchResults] = useState<
    AdminInfluencerSearchResult[]
  >([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);

  const handleSearch = async () => {
    try {
      setIsSearching(true);

      const data = await searchInfluencersForAdmin({
        keywords: searchKeywords,
        minFollowers,
        minPosts,
        lastPostDate,
      });

      setSearchResults(data);
      setHasSearched(true);
    } catch (error) {
      console.error('관리자 검색 실패:', error);
      alert('검색에 실패했습니다. 백엔드 서버 또는 관리자 권한을 확인해주세요.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCrawl = async () => {
    const keywords = parseKeywords(searchKeywords);

    if (keywords.length === 0) {
      alert('크롤링을 진행할 수집 키워드를 입력해주세요.');
      return;
    }

    try {
      setIsCrawling(true);

      const data = await crawlInfluencersByKeywords({
        keywords,
        maxResults: maxResults ? Number(maxResults) : undefined,
        minFollowers: minFollowers ? Number(minFollowers) : undefined,
        minPosts: minPosts ? Number(minPosts) : undefined,
        followRatio: followRatio ? Number(followRatio) : undefined,
        engagementRate: engagementRate ? Number(engagementRate) : undefined,
        lastPostDate,
      });

      alert(data.message || '키워드 기반 크롤링이 시작되었습니다.');
    } catch (error) {
      console.error('키워드 기반 크롤링 실패:', error);
      alert('크롤링 요청에 실패했습니다. 백엔드 서버 또는 API 설정을 확인해주세요.');
    } finally {
      setIsCrawling(false);
    }
  };

  const handleDelete = async (influencerId: number) => {
    const ok = window.confirm('이 인플루언서를 삭제하시겠습니까?');

    if (!ok) return;

    try {
      await deleteInfluencerForAdmin(influencerId);

      setSearchResults((prev) =>
        prev.filter((inf) => inf.influencer_id !== influencerId)
      );

      alert('삭제되었습니다.');
    } catch (error) {
      console.error('인플루언서 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">System Console</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              인플루언서 검색 및 수집
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  수집 키워드
                </label>

                <input
                  type="text"
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: 패션, 뷰티, 리빙"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    최소 팔로워 수
                  </label>

                  <input
                    type="number"
                    value={minFollowers}
                    onChange={(e) => setMinFollowers(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    최소 게시물 수
                  </label>

                  <input
                    type="number"
                    value={minPosts}
                    onChange={(e) => setMinPosts(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    최대 수집 인플루언서 수
                  </label>

                  <input
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    팔로워/팔로잉 비율
                  </label>

                  <input
                    type="number"
                    step="0.1"
                    value={followRatio}
                    onChange={(e) => setFollowRatio(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    최소 반응률
                  </label>

                  <input
                    type="number"
                    step="0.001"
                    value={engagementRate}
                    onChange={(e) => setEngagementRate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    마지막 게시물 업로드 일자
                  </label>

                  <input
                    type="text"
                    value={lastPostDate}
                    onChange={(e) => setLastPostDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="2026-04-29"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Search className="w-5 h-5" />
                  {isSearching ? '검색 중...' : 'DB 검색'}
                </button>

                <button
                  onClick={handleCrawl}
                  disabled={isCrawling}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <DownloadCloud className="w-5 h-5" />
                  {isCrawling ? '크롤링 요청 중...' : '키워드 기반 크롤링'}
                </button>
              </div>
            </div>

            {hasSearched && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  검색 결과 ({searchResults.length}명)
                </h3>

                {searchResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-[18%]" />
                        <col className="w-[18%]" />
                        <col className="w-[13%]" />
                        <col className="w-[12%]" />
                        <col className="w-[13%]" />
                        <col className="w-[16%]" />
                        <col className="w-[10%]" />
                      </colgroup>

                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700">
                            이름
                          </th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700">
                            Instagram
                          </th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                            팔로워
                          </th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                            게시물 수
                          </th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                            카테고리
                          </th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                            마지막 게시물
                          </th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                            관리
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {searchResults.map((inf) => (
                          <tr
                            key={inf.influencer_id}
                            className="border-b border-slate-100"
                          >
                            <td className="py-3 px-3 text-slate-900 font-medium">
                              <div className="truncate">
                                {inf.full_name || inf.username || '이름 없음'}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-slate-600">
                              <div className="truncate">@{inf.username}</div>
                            </td>

                            <td className="py-3 px-3 text-slate-900 whitespace-nowrap">
                              {formatFollowers(inf.followers_count || 0)}
                            </td>

                            <td className="py-3 px-3 text-slate-900 whitespace-nowrap">
                              {(inf.posts_count || 0).toLocaleString()}
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex max-w-full px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-semibold">
                                <span className="truncate">
                                  {inf.category || '기타'}
                                </span>
                              </span>
                            </td>

                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                              {formatDate(inf.last_post_date)}
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <button
                                onClick={() => handleDelete(inf.influencer_id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-lg">
                    <p className="text-slate-600">검색 결과가 없습니다.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
