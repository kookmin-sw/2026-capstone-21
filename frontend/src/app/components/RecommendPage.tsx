import { useState, useMemo, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { Influencer, Category } from '../types';
import { InfluencerProfileModal } from './InfluencerProfileModal';
import { getCategories } from '../../api/category';
import { createMallInput } from '../../api/mallInput';
import { getPrediction } from '../../api/recommendation';
import { createUserActionLog } from '../../api/userActionLog';

export function RecommendPage() {
  const { influencers, interestList, toggleInterest, selectInfluencer } = useInfluencers();

  const [categories, setCategories] = useState<Category[]>([]);
  const [runId, setRunId] = useState<number | null>(null);
  const [recommendText, setRecommendText] = useState('');
  const [recommendResults, setRecommendResults] = useState<Influencer[]>([]);
  const [recommendScores, setRecommendScores] = useState<Record<string, number>>({});
  const [detailScores, setDetailScores] = useState<Record<string, { similarity: number; personalization: number; grade: number }>>({});
  const [isRecommending, setIsRecommending] = useState(false);
  const [recCategory, setRecCategory] = useState<string[]>([]);
  const [recFollowerRange, setRecFollowerRange] = useState<string[]>([]);
  const [recKeywords, setRecKeywords] = useState<string[]>([]);
  const [customMin, setCustomMin] = useState<string>('');
  const [customMax, setCustomMax] = useState<string>('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loadingReasons, setLoadingReasons] = useState<Record<string, boolean>>({});
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => { getCategories().then((d) => setCategories(d as Category[])).catch(console.error); }, []);
  useEffect(() => { setCurrentPage(1); }, [recommendResults, recCategory, recFollowerRange, recKeywords, customMin, customMax]);

  const filteredRecommendResults = useMemo(() => {
    if (recommendResults.length === 0) return [];
    return recommendResults.filter((inf) => {
      if (recCategory.length > 0 && !recCategory.includes(inf.category)) return false;
      if (recFollowerRange.length > 0) {
        const ranges: Record<string, [number, number]> = { '1000-5000': [1000, 5000], '5000-10000': [5000, 10000], '10000-30000': [10000, 30000], '30000-50000': [30000, 50000], '50000+': [50000, Infinity] };
        const inRange = recFollowerRange.some((r) => { const [min, max] = ranges[r] || [0, Infinity]; return inf.followers >= min && inf.followers <= max; });
        if (!inRange) return false;
      }
      if (recKeywords.length > 0 && !recKeywords.some((kw) => inf.styleKeywords.some((sk) => sk.includes(kw)))) return false;
      if (customMin && inf.followers < Number(customMin)) return false;
      if (customMax && inf.followers > Number(customMax)) return false;
      return true;
    });
  }, [recommendResults, recCategory, recFollowerRange, recKeywords, customMin, customMax]);

  const filteredBrowse = useMemo(() => {
    return influencers.filter((inf) => {
      if (recCategory.length > 0 && !recCategory.includes(inf.category)) return false;
      if (recFollowerRange.length > 0) {
        const ranges: Record<string, [number, number]> = { '1000-5000': [1000, 5000], '5000-10000': [5000, 10000], '10000-30000': [10000, 30000], '30000-50000': [30000, 50000], '50000+': [50000, Infinity] };
        const inRange = recFollowerRange.some((r) => { const [min, max] = ranges[r] || [0, Infinity]; return inf.followers >= min && inf.followers <= max; });
        if (!inRange) return false;
      }
      if (recKeywords.length > 0 && !recKeywords.some((kw) => inf.styleKeywords.some((sk) => sk.includes(kw)))) return false;
      if (customMin && inf.followers < Number(customMin)) return false;
      if (customMax && inf.followers > Number(customMax)) return false;
      return true;
    });
  }, [influencers, recCategory, recFollowerRange, recKeywords, customMin, customMax]);

  const handleRecommend = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) { alert('로그인이 필요합니다'); return; }
    if (!recommendText.trim()) { alert('브랜드 설명을 입력해주세요.'); return; }
    setIsRecommending(true);
    try {
      const mallInput = await createMallInput({ user_id: Number(userId), input_text: recommendText });
      const res = await getPrediction(Number(mallInput.input_id), Number(userId), {});
      setRunId(res.run_id ?? null);

      const sorted = [...(res.recommendations || [])].sort((a: any, b: any) => (a.rank_no ?? 0) - (b.rank_no ?? 0));
      const mapped: Influencer[] = sorted.map((item: any) => {
        const id = String(item.id ?? item.influencer_id);
        const matched = influencers.find((i) => String(i.id) === id);
        if (matched) return matched;
        return { id, name: item.full_name ?? item.username ?? '이름 없음', photo: item.profile_pic_url || `/profile_pic_HD/${item.username}.jpg`, followers: item.followers_count ?? 0, category: item.category ?? '기타', mainGender: 'both' as const, mainAge: '25-34' as const, selections: 0, gradeScore: item.grade_score ?? 0, instagram: item.username ?? '', styleKeywords: [] };
      });
      setRecommendResults(mapped);

      const scores: Record<string, number> = {};
      const detailScores: Record<string, { similarity: number; personalization: number; grade: number }> = {};
      sorted.forEach((item: any) => {
        const id = String(item.id ?? item.influencer_id);
        scores[id] = item.score ?? 0;
        detailScores[id] = { similarity: item.similarity_score ?? 0, personalization: item.personalization_score ?? 0, grade: item.grade_score ?? 0 };
      });
      setRecommendScores(scores);
      setDetailScores(detailScores);
    } catch { alert('추천 실패'); }
    setIsRecommending(false);
  };

  const saveActionLog = async (influencerId: string, actionType: string) => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    await createUserActionLog({ user_id: Number(userId), influencer_id: Number(influencerId), action_type: actionType, run_id: runId });
  };

  const handleCardClick = async (id: string) => {
    selectInfluencer(id);
    await saveActionLog(id, 'detail_view');
    const inf = influencers.find((i) => String(i.id) === id) || recommendResults.find((i) => String(i.id) === id);
    if (inf) setSelectedInfluencer(inf);
  };

  const handleFavoriteClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await toggleInterest(id);
      await saveActionLog(id, result === 'added' ? 'favorite_add' : 'favorite_remove');
    } catch { alert('관심 등록/해제에 실패했습니다.'); }
  };

  return (
    <div>
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">Recommendation</h1>

        <div className="p-4 border border-slate-200 rounded-2xl bg-white">
          <div className="flex gap-3">
            <input value={recommendText} onChange={(e) => setRecommendText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRecommend(); }} placeholder="브랜드, 상품의 특징, 키워드, 원하는 분위기를 입력하세요" className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button onClick={handleRecommend} disabled={isRecommending} className={`px-6 py-3 rounded-xl font-semibold transition ${isRecommending ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
              {isRecommending ? '추천중...' : '추천받기'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div>
              <label className="font-semibold text-sm text-slate-700 block mb-2">팔로워 수</label>
              <div className="flex flex-wrap gap-2 items-center">
                {[{ label: '1K - 5K', value: '1000-5000' }, { label: '5K - 10K', value: '5000-10000' }, { label: '10K - 30K', value: '10000-30000' }, { label: '30K - 50K', value: '30000-50000' }, { label: '50K+', value: '50000+' }].map((r) => (
                  <button key={r.value} onClick={() => { setRecFollowerRange((prev) => prev.includes(r.value) ? prev.filter((v) => v !== r.value) : [...prev, r.value]); setCustomMin(''); setCustomMax(''); }} className={`px-4 py-2 rounded-lg text-sm transition ${recFollowerRange.includes(r.value) ? 'bg-purple-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    {r.label}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-2">
                  <input type="number" placeholder="최소" value={customMin} onChange={(e) => { setCustomMin(e.target.value); setRecFollowerRange(e.target.value ? 'custom' : ''); }} className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <span className="text-slate-400">~</span>
                  <input type="number" placeholder="최대" value={customMax} onChange={(e) => { setCustomMax(e.target.value); if (customMin) setRecFollowerRange('custom'); }} className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </div>
            <div>
              <label className="font-semibold text-sm text-slate-700 block mb-2">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button key={String(cat)} onClick={() => setRecCategory((prev) => prev.includes(String(cat)) ? prev.filter((c) => c !== String(cat)) : [...prev, String(cat)])} className={`px-4 py-2 rounded-lg text-sm transition ${recCategory.includes(String(cat)) ? 'bg-purple-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    {String(cat)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-semibold text-sm text-slate-700 block mb-2">스타일 키워드</label>
              <div className="flex flex-wrap gap-2">
                {['일상', '감성', '트렌드', '자연', '카페', '디저트', '사진', '편안함', '사랑', '행복', '공간', '디자인', '맛집', '정보', '브랜드'].map((kw) => (
                  <button key={kw} onClick={() => setRecKeywords((prev) => prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw])} className={`px-4 py-2 rounded-lg text-sm transition ${recKeywords.includes(kw) ? 'bg-purple-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {recommendResults.length > 0 ? (
            <div className="mt-6">
              <div className="font-semibold mb-4">추천 결과 — {filteredRecommendResults.length}명 매칭</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                {filteredRecommendResults.slice(0, currentPage * itemsPerPage).map((influencer) => {
                  const influencerId = String(influencer.id);
                  const isFavorite = interestList.includes(influencerId);
                  const ds = detailScores[influencerId];
                  return (
                    <div key={influencer.id} onClick={() => handleCardClick(influencerId)} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden border border-slate-100">
                      <div className="w-full h-72 overflow-hidden relative bg-gradient-to-b from-slate-100 to-slate-300">
                        <img src={influencer.photo} alt={influencer.name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile.png'; }} className="w-full h-full object-cover" />
                        <button onClick={(e) => handleFavoriteClick(influencerId, e)} className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-md hover:bg-yellow-50 transition" title="My Picks">
                          <Star className={`w-6 h-6 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                        </button>
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="font-bold text-xl text-slate-900">{influencer.name}</div>
                        <div className="text-slate-600">{Number(influencer.followers || 0).toLocaleString()} followers</div>
                        <div className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">{influencer.category}</div>
                        {recommendScores[influencerId] !== undefined && (
                          <div className="text-xs text-purple-600 font-semibold">추천 점수: {(recommendScores[influencerId] * 100).toFixed(1)}점</div>
                        )}
                        {reasons[influencerId] ? (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg space-y-1">
                            {ds && (
                              <div className="text-xs text-slate-500">유사도 {(ds.similarity * 100).toFixed(0)} · 개인화 {(ds.personalization * 100).toFixed(0)} · 등급 {(ds.grade * 100).toFixed(0)}</div>
                            )}
                            <p>{reasons[influencerId]}</p>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLoadingReasons((prev) => ({ ...prev, [influencerId]: true }));
                              fetch(`${import.meta.env.VITE_API_BASE_URL}/recommendations/reason`, {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ influencer_id: Number(influencerId), input_text: recommendText, score: recommendScores[influencerId] || 0, similarity_score: ds?.similarity || 0, personalization_score: ds?.personalization || 0, grade_score: ds?.grade || 0 }),
                              }).then((r) => r.json()).then((d) => { setReasons((prev) => ({ ...prev, [influencerId]: d.reason })); setLoadingReasons((prev) => ({ ...prev, [influencerId]: false })); });
                            }}
                            disabled={loadingReasons[influencerId]}
                            className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition"
                          >
                            {loadingReasons[influencerId] ? "분석 중..." : "추천 이유 보기"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredRecommendResults.length > currentPage * itemsPerPage && (
                <div className="mt-12 flex justify-center">
                  <button onClick={() => setCurrentPage((p) => p + 1)} className="px-10 py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-2xl font-bold hover:bg-purple-50 transition shadow-sm">
                    Load More ({currentPage * itemsPerPage} / {filteredRecommendResults.length})
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <div className="font-semibold mb-4 text-slate-600">인플루언서 둘러보기 — {filteredBrowse.length}명</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                {filteredBrowse.slice(0, currentPage * itemsPerPage).map((influencer) => {
                  const influencerId = String(influencer.id);
                  const isFavorite = interestList.includes(influencerId);
                  return (
                    <div key={influencer.id} onClick={() => handleCardClick(influencerId)} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden border border-slate-100">
                      <div className="w-full h-72 overflow-hidden relative bg-gradient-to-b from-slate-100 to-slate-300">
                        <img src={influencer.photo} alt={influencer.name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile.png'; }} className="w-full h-full object-cover" />
                        <button onClick={(e) => handleFavoriteClick(influencerId, e)} className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-md hover:bg-yellow-50 transition" title="My Picks">
                          <Star className={`w-6 h-6 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                        </button>
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="font-bold text-xl text-slate-900">{influencer.name}</div>
                        <div className="text-slate-600">{Number(influencer.followers || 0).toLocaleString()} followers</div>
                        <div className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">{influencer.category}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredBrowse.length > currentPage * itemsPerPage && (
                <div className="mt-12 flex justify-center">
                  <button onClick={() => setCurrentPage((p) => p + 1)} className="px-10 py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-2xl font-bold hover:bg-purple-50 transition shadow-sm">
                    Load More ({currentPage * itemsPerPage} / {filteredBrowse.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedInfluencer && (<InfluencerProfileModal influencer={selectedInfluencer} onClose={() => setSelectedInfluencer(null)} runId={runId} />)}
    </div>
  );
}
