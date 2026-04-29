import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeftRight, Users, Trophy, Search } from 'lucide-react';
import { Influencer } from '../types';

const BASE_URL = "http://localhost:8000/insights/compare";

type CompareResponse = {
  influencer_id: number;
  username: string;
  followers_count: number | null;
  posts_count: number | null;
  grade_score: number | null;
  categories: string[];
};

export function CompareInfluencers() {
  const [influencers, setInfluencers] = useState<CompareResponse[]>([]);
  const [influencer1, setInfluencer1] = useState<CompareResponse | null>(null);
  const [influencer2, setInfluencer2] = useState<CompareResponse | null>(null);

  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);

  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');

  const dropdown1Ref = useRef<HTMLDivElement>(null);
  const dropdown2Ref = useRef<HTMLDivElement>(null);

  // ✅ DB에서 influencer list 가져오기 (간단 버전)
  useEffect(() => {
    fetch("http://localhost:8000/influencers/")
      .then(res => res.json())
      .then(data => setInfluencers(data))
      .catch(console.error);
  }, []);

  // outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdown1Ref.current && !dropdown1Ref.current.contains(event.target as Node)) {
        setShowDropdown1(false);
        setSearch1('');
      }
      if (dropdown2Ref.current && !dropdown2Ref.current.contains(event.target as Node)) {
        setShowDropdown2(false);
        setSearch2('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredInfluencers1 = useMemo(() => {
    return influencers.filter((inf) =>
      inf.username.toLowerCase().includes(search1.toLowerCase())
    );
  }, [influencers, search1]);

  const filteredInfluencers2 = useMemo(() => {
    return influencers.filter((inf) =>
      inf.username.toLowerCase().includes(search2.toLowerCase())
    );
  }, [influencers, search2]);

  const getRank = (id: number) => {
    const sorted = [...influencers].sort((a, b) =>
      (b.grade_score ?? 0) - (a.grade_score ?? 0)
    );
    return sorted.findIndex(i => i.influencer_id === id) + 1;
  };

  return (
    <motion.div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">

      <h2 className="text-xl font-bold mb-6">Influencer Comparison (DB 기반)</h2>

      {/* SELECT */}
      <div className="grid grid-cols-2 gap-4 mb-8">

        {/* LEFT */}
        <div ref={dropdown1Ref} className="relative">
          <button
            onClick={() => setShowDropdown1(v => !v)}
            className="w-full px-4 py-3 border rounded-xl text-left"
          >
            {influencer1 ? influencer1.username : "Select Influencer"}
          </button>

          {showDropdown1 && (
            <div className="absolute w-full bg-white border mt-2 rounded-xl max-h-60 overflow-auto z-10">
              {filteredInfluencers1.map((inf) => (
                <button
                  key={inf.influencer_id}
                  onClick={() => {
                    setInfluencer1(inf);
                    setShowDropdown1(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-100"
                >
                  {inf.username}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div ref={dropdown2Ref} className="relative">
          <button
            onClick={() => setShowDropdown2(v => !v)}
            className="w-full px-4 py-3 border rounded-xl text-left"
          >
            {influencer2 ? influencer2.username : "Select Influencer"}
          </button>

          {showDropdown2 && (
            <div className="absolute w-full bg-white border mt-2 rounded-xl max-h-60 overflow-auto z-10">
              {filteredInfluencers2.map((inf) => (
                <button
                  key={inf.influencer_id}
                  onClick={() => {
                    setInfluencer2(inf);
                    setShowDropdown2(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-100"
                >
                  {inf.username}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RESULT */}
      {influencer1 && influencer2 ? (
        <div className="space-y-4">

          <div className="grid grid-cols-3 gap-4 text-center">
            <div />
            <div className="font-bold">{influencer1.username}</div>
            <div className="font-bold">{influencer2.username}</div>
          </div>

          {/* FOLLOWERS */}
          <div className="grid grid-cols-3 gap-4 py-3 border-t">
            <div className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" /> Followers
            </div>
            <div className="text-center">
              {influencer1.followers_count}
            </div>
            <div className="text-center">
              {influencer2.followers_count}
            </div>
          </div>

          {/* SCORE */}
          <div className="grid grid-cols-3 gap-4 py-3 border-t">
            <div className="font-semibold">Grade Score</div>
            <div className="text-center">{influencer1.grade_score}</div>
            <div className="text-center">{influencer2.grade_score}</div>
          </div>

          {/* RANK */}
          <div className="grid grid-cols-3 gap-4 py-3 border-t">
            <div className="font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Rank
            </div>
            <div className="text-center">#{getRank(influencer1.influencer_id)}</div>
            <div className="text-center">#{getRank(influencer2.influencer_id)}</div>
          </div>

        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">
          Select two influencers to compare
        </div>
      )}
    </motion.div>
  );
}
