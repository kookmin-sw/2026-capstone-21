import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeftRight, Users, Trophy, Search } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { Influencer } from '../types';

export function CompareInfluencers() {
  const { influencers } = useInfluencers();
  const [influencer1, setInfluencer1] = useState<Influencer | null>(null);
  const [influencer2, setInfluencer2] = useState<Influencer | null>(null);
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const dropdown1Ref = useRef<HTMLDivElement>(null);
  const dropdown2Ref = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
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

  const sortedInfluencers = [...influencers].sort((a, b) => b.selections - a.selections);

  const filteredInfluencers1 = useMemo(() => {
    return influencers.filter((inf) =>
      inf.name.toLowerCase().includes(search1.toLowerCase())
    );
  }, [influencers, search1]);

  const filteredInfluencers2 = useMemo(() => {
    return influencers.filter((inf) =>
      inf.name.toLowerCase().includes(search2.toLowerCase())
    );
  }, [influencers, search2]);

  const getRank = (influencerId: string) => {
    return sortedInfluencers.findIndex((inf) => inf.id === influencerId) + 1;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
    >
      <h2 className="text-xl font-bold text-slate-900 mb-6">Side-by-Side Comparison</h2>

      {/* Selection Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Influencer 1 */}
        <div ref={dropdown1Ref} className="relative">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select First Influencer</label>
          <button
            onClick={() => setShowDropdown1(!showDropdown1)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-left hover:bg-slate-50 transition-colors"
          >
            {influencer1 ? (
              <span className="text-slate-900">{influencer1.name}</span>
            ) : (
              <span className="text-slate-400">Link:D Match!</span>
            )}
          </button>
          {showDropdown1 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredInfluencers1.length > 0 ? (
                  filteredInfluencers1.map((inf) => (
                    <button
                      key={inf.id}
                      onClick={() => {
                        setInfluencer1(inf);
                        setShowDropdown1(false);
                        setSearch1('');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-3"
                    >
                      <img src={inf.photo} alt={inf.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="font-semibold text-slate-900">{inf.name}</div>
                        <div className="text-xs text-slate-600 capitalize">{inf.category}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No influencers found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Influencer 2 */}
        <div ref={dropdown2Ref} className="relative">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Second Influencer</label>
          <button
            onClick={() => setShowDropdown2(!showDropdown2)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-left hover:bg-slate-50 transition-colors"
          >
            {influencer2 ? (
              <span className="text-slate-900">{influencer2.name}</span>
            ) : (
              <span className="text-slate-400">Link:D Match!</span>
            )}
          </button>
          {showDropdown2 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={search2}
                    onChange={(e) => setSearch2(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredInfluencers2.length > 0 ? (
                  filteredInfluencers2.map((inf) => (
                    <button
                      key={inf.id}
                      onClick={() => {
                        setInfluencer2(inf);
                        setShowDropdown2(false);
                        setSearch2('');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-3"
                    >
                      <img src={inf.photo} alt={inf.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="font-semibold text-slate-900">{inf.name}</div>
                        <div className="text-xs text-slate-600 capitalize">{inf.category}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No influencers found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      {influencer1 && influencer2 ? (
        <div className="space-y-4">
          {/* Photos */}
          <div className="grid grid-cols-3 gap-4">
            <div></div>
            <div className="text-center">
              <img
                src={influencer1.photo}
                alt={influencer1.name}
                className="w-32 h-32 rounded-2xl object-cover mx-auto mb-2"
              />
              <div className="font-bold text-slate-900">{influencer1.name}</div>
            </div>
            <div className="text-center">
              <img
                src={influencer2.photo}
                alt={influencer2.name}
                className="w-32 h-32 rounded-2xl object-cover mx-auto mb-2"
              />
              <div className="font-bold text-slate-900">{influencer2.name}</div>
            </div>
          </div>

          {/* Comparison Rows */}
          <div className="divide-y divide-slate-200">
            {/* Followers */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="font-semibold text-slate-700 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Followers
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {influencer1.followers >= 1000
                    ? `${(influencer1.followers / 1000).toFixed(1)}K`
                    : influencer1.followers}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {influencer2.followers >= 1000
                    ? `${(influencer2.followers / 1000).toFixed(1)}K`
                    : influencer2.followers}
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="font-semibold text-slate-700">Category</div>
              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold capitalize">
                  {influencer1.category}
                </span>
              </div>
              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold capitalize">
                  {influencer2.category}
                </span>
              </div>
            </div>

            {/* Rank */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="font-semibold text-slate-700 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Rank
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">#{getRank(influencer1.id)}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">#{getRank(influencer2.id)}</div>
              </div>
            </div>

            {/* Selections */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="font-semibold text-slate-700">Total Selections</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{influencer1.selections}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{influencer2.selections}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <ArrowLeftRight className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600">Select two influencers to compare</p>
        </div>
      )}
    </motion.div>
  );
}
