import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { customFetch } from "../../api/client";

const API = import.meta.env.VITE_API_BASE_URL;

interface Profile {
  user_name: string;
  email: string;
  mall_name: string;
  mall_url: string;
  mall_description: string;
}

interface RunItem {
  run_id: number;
  input_text: string | null;
  status: string;
  requested_at: string;
  result_count: number;
}

export function MyPage() {
  const [profile, setProfile] = useState<Profile>({ user_name: "", email: "", mall_name: "", mall_url: "", mall_description: "" });
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    Promise.all([
      customFetch(`${API}/auth/profile/${userId}`).then((r) => r.json()),
      customFetch(`${API}/recommendations/history/${userId}`).then((r) => r.json()),
    ])
      .then(([p, r]) => { setProfile(p); setRuns(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    await fetch(`${API}/auth/profile/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: profile.user_name,
        mall_name: profile.mall_name,
        mall_url: profile.mall_url,
      }),
    });
    setSaving(false);
    localStorage.setItem("user_name", profile.user_name);
    alert("저장되었습니다.");
  };

  const handleAnalyze = async () => {
    if (!userId || !profile.mall_url) { alert("쇼핑몰 URL을 먼저 입력하세요."); return; }
    // 먼저 저장
    await fetch(`${API}/auth/profile/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: profile.user_name, mall_name: profile.mall_name, mall_url: profile.mall_url }),
    });
    setAnalyzing(true);
    try {
      const res = await fetch(`${API}/auth/profile/${userId}/analyze-mall`, { method: "POST" });
      if (!res.ok) { alert("분석 실패: " + (await res.json()).detail); setAnalyzing(false); return; }
      const data = await res.json();
      setProfile({ ...profile, mall_description: data.mall_description || "" });
    } catch { alert("분석 실패"); }
    setAnalyzing(false);
  };

  if (loading) return <div className="text-center py-12 text-slate-500">로딩 중...</div>;
  if (!userId) return <div className="text-center py-12 text-slate-500">로그인이 필요합니다.</div>;

  return (
    <div className="space-y-8">
      {/* 프로필 편집 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">프로필</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">이름</label>
            <input
              value={profile.user_name}
              onChange={(e) => setProfile({ ...profile, user_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">이메일</label>
            <input value={profile.email} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">쇼핑몰 이름</label>
            <input
              value={profile.mall_name || ""}
              onChange={(e) => setProfile({ ...profile, mall_name: e.target.value })}
              placeholder="예: 마이브랜드"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">쇼핑몰 URL</label>
            <input
              value={profile.mall_url || ""}
              onChange={(e) => setProfile({ ...profile, mall_url: e.target.value })}
              placeholder="예: https://mybrand.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-slate-400 transition"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !profile.mall_url}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:bg-slate-400 transition"
          >
            {analyzing ? "분석 중..." : "🔍 쇼핑몰 분위기 분석"}
          </button>
        </div>
        {profile.mall_description && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-xs font-semibold text-purple-700 mb-1">쇼핑몰 분위기 (추천에 자동 반영됨)</p>
            <p className="text-sm text-slate-700">{profile.mall_description}</p>
          </div>
        )}
      </section>

      {/* 추천 기록 */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4">추천 기록</h2>
        {runs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">추천 기록이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <button
                key={run.run_id}
                onClick={() => navigate(`/recommendation/${run.run_id}`)}
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-purple-300 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">
                      {run.input_text || `추천 #${run.run_id}`}
                    </span>
                    <span className="ml-3 text-xs text-slate-400">
                      {new Date(run.requested_at).toLocaleString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      {run.result_count}명 추천
                    </span>
                    <span className="text-slate-400">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
