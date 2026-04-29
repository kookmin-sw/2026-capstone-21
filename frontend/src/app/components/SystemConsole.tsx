import { useState } from 'react';
import { Search } from 'lucide-react';
import { Influencer } from '../types';

// 목 데이터 - 검색 결과로 표시될 인플루언서
const mockSearchResults: Influencer[] = [
  {
    id: '101',
    name: '김민지',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    followers: 125000,
    category: '패션',
    mainGender: 'women',
    mainAge: '18-24',
    selections: 0,
    instagram: 'minji_fashion',
    styleKeywords: ['패션', '스트릿', '캐주얼', '데일리룩'],
  },
  {
    id: '102',
    name: '박서준',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    followers: 89000,
    category: '헬스·웰니스',
    mainGender: 'men',
    mainAge: '25-34',
    selections: 0,
    instagram: 'seojun_fitness',
    styleKeywords: ['헬스', '운동', '다이어트', '건강'],
  },
  {
    id: '103',
    name: '이수현',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    followers: 210000,
    category: '뷰티',
    mainGender: 'women',
    mainAge: '25-34',
    selections: 0,
    instagram: 'soohyun_beauty',
    styleKeywords: ['뷰티', '화장품', '스킨케어', '메이크업'],
  },
  {
    id: '104',
    name: '유로이홈',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    followers: 496473,
    category: '리빙',
    mainGender: 'women',
    mainAge: '25-34',
    selections: 0,
    instagram: 'uroi.home',
    styleKeywords: ['리빙', '살림템', '음식물처리기', '인테리어', '청소용품', '주방용품'],
  },
  {
    id: '105',
    name: '29cm.official',
    photo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
    followers: 325000,
    category: '패션',
    mainGender: 'both',
    mainAge: '25-34',
    selections: 0,
    instagram: '29cm.official',
    styleKeywords: ['리빙', '세레모니룩', '운동복', '스티커', '피크닉'],
  },
];

export function SystemConsole() {
  const [searchKeywords, setSearchKeywords] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [lastPostDate, setLastPostDate] = useState('');
  const [searchResults, setSearchResults] = useState<Influencer[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    // 검색 조건에 따라 필터링 (목 데이터 사용)
    let results = [...mockSearchResults];

    // 키워드 필터 - styleKeywords 검색
    if (searchKeywords.trim()) {
      const keywords = searchKeywords.toLowerCase().split(',').map(k => k.trim());
      results = results.filter(inf =>
        keywords.some(keyword =>
          inf.styleKeywords.some(sk => sk.toLowerCase().includes(keyword))
        )
      );
    }

    // 최소 팔로워 수 필터
    if (minFollowers) {
      const minFollowersNum = parseInt(minFollowers);
      results = results.filter(inf => inf.followers >= minFollowersNum);
    }

    // 마지막 게시물 업로드 일자 필터 (현재는 목 데이터이므로 로직만 구현)
    // 실제 구현 시에는 lastPostDate 값을 사용하여 필터링

    setSearchResults(results);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">System Console</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">인플루언서 검색</h2>

            {/* 검색 폼 */}
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    수집 키워드 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={searchKeywords}
                    onChange={(e) => setSearchKeywords(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      placeholder="20260429"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  검색
                </button>
            </div>

            {/* 검색 결과 */}
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
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">이름</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Instagram</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">팔로워</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">카테고리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map((inf) => (
                            <tr key={inf.id} className="border-b border-slate-100">
                              <td className="py-3 px-4 text-slate-900 font-medium">{inf.name}</td>
                              <td className="py-3 px-4 text-slate-600">@{inf.instagram}</td>
                              <td className="py-3 px-4 text-slate-900">
                                {inf.followers >= 1000
                                  ? `${(inf.followers / 1000).toFixed(1)}K`
                                  : inf.followers}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-semibold">
                                  {inf.category}
                                </span>
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
