import { useState } from 'react';
import { Search } from 'lucide-react';
import {
  searchInfluencersForAdmin,
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

export function SystemConsole() {
  const [searchKeywords, setSearchKeywords] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [lastPostDate, setLastPostDate] = useState('');
  const [searchResults, setSearchResults] = useState<
    AdminInfluencerSearchResult[]
  >([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    try {
      setIsLoading(true);

      const data = await searchInfluencersForAdmin({
        keywords: searchKeywords,
        minFollowers,
        lastPostDate,
      });

      setSearchResults(data);
      setHasSearched(true);
    } catch (error) {
      console.error('관리자 검색 실패:', error);
      alert('검색에 실패했습니다. 백엔드 서버 또는 관리자 권한을 확인해주세요.');
    } finally {
      setIsLoading(false);
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
              인플루언서 검색
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Search className="w-5 h-5" />
                {isLoading ? '검색 중...' : '검색'}
              </button>
            </div>

            {hasSearched && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  검색 결과 ({searchResults.length}명)
                </h3>

                {searchResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                            이름
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                            Instagram
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                            팔로워
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                            게시물 수
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                            카테고리
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                            마지막 게시물
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {searchResults.map((inf) => (
                          <tr
                            key={inf.influencer_id}
                            className="border-b border-slate-100"
                          >
                            <td className="py-3 px-4 text-slate-900 font-medium">
                              {inf.full_name || inf.username || '이름 없음'}
                            </td>

                            <td className="py-3 px-4 text-slate-600">
                              @{inf.username}
                            </td>

                            <td className="py-3 px-4 text-slate-900">
                              {formatFollowers(inf.followers_count || 0)}
                            </td>

                            <td className="py-3 px-4 text-slate-900">
                              {(inf.posts_count || 0).toLocaleString()}
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-semibold">
                                {inf.category || '기타'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-slate-600">
                              {formatDate(inf.last_post_date)}
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
