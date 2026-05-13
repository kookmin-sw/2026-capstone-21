import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { customFetch } from "../../api/client";

const API = import.meta.env.VITE_API_BASE_URL;

interface Recommendation {
  rank_no: number;
  influencer_id: number;
  username: string | null;
  full_name: string | null;
  profile_pic_url: string | null;
  followers_count: number;
  category: string | null;
  grade_score: number | null;
  final_score: number;
  similarity_score: number | null;
  personalization_score: number | null;
}

interface RunDetail {
  run_id: number;
  user_id: number;
  input_text: string | null;
  status: string;
  requested_at: string;
  recommendations: Recommendation[];
}

export function RecommendationDetail() {
  const { id } = useParams();
  const [data, setData] = useState<RunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId || !id) { setLoading(false); setError("로그인이 필요합니다."); return; }

    customFetch(`${API}/recommendations/${id}?user_id=${userId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403) throw new Error("접근 권한이 없습니다.");
          if (res.status === 404) throw new Error("추천 결과를 찾을 수 없습니다.");
          throw new Error("조회 실패");
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12 text-slate-500">로딩 중...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!data) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">추천 결과 #{data.run_id} — {data.recommendations.length}명 매칭</h1>
      <p className="text-slate-500 mb-6">
        {data.input_text && <span className="text-slate-700 font-medium">"{data.input_text}"</span>}
        {" · "}
        {new Date(data.requested_at + "Z").toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {data.recommendations.map((rec) => (
          <div key={rec.influencer_id} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
            <div className="w-full h-48 bg-slate-200 overflow-hidden">
              <img
                src={rec.profile_pic_url || `/profile_pic_HD/${rec.username}.jpg`}
                alt={rec.username || ""}
                onError={(e) => { (e.target as HTMLImageElement).src = "/default-profile.png"; }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  {rec.full_name || `@${rec.username}`}
                </span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  #{rec.rank_no}
                </span>
              </div>
              {rec.username && <div className="text-sm text-slate-500">@{rec.username}</div>}
              <div className="text-sm text-slate-600">{(rec.followers_count || 0).toLocaleString()} followers</div>
              {rec.category && (
                <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                  {rec.category}
                </span>
              )}
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div>추천 점수: <span className="font-semibold text-slate-700">{(rec.final_score * 100).toFixed(1)}점</span></div>
                {rec.grade_score != null && <div>Grade: {rec.grade_score.toFixed(1)}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
