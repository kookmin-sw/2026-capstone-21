import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Star, Heart, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useInfluencers } from '../context/InfluencerContext';
import { Category, Influencer } from '../types';
import { InfluencerProfileModal } from './InfluencerProfileModal';

export function InterestList() {
  const { influencers, interestList, toggleInterest } = useInfluencers();
  const [organizeByCategory, setOrganizeByCategory] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<{ influencer: Influencer; rank: number } | null>(null);

  const interestedInfluencers = useMemo(() => {
    return influencers.filter((inf) => interestList.includes(inf.id));
  }, [influencers, interestList]);

  const groupedByCategory = useMemo(() => {
    const grouped: Record<Category, typeof interestedInfluencers> = {
      패션: [],
      뷰티: [],
      인테리어: [],
      리빙: [],
      '푸드·맛집': [],
      여행: [],
      '헬스·웰니스': [],
      '육아·가족': [],
      반려동물: [],
      라이프스타일: [],
    };

    interestedInfluencers.forEach((inf) => {
      grouped[inf.category].push(inf);
    });

    return grouped;
  }, [interestedInfluencers]);

  const sortedInfluencers = useMemo(() => {
    return [...influencers].sort((a, b) => b.selections - a.selections);
  }, [influencers]);

  const getRank = (influencerId: string) => {
    return sortedInfluencers.findIndex((inf) => inf.id === influencerId) + 1;
  };

  const handleNameClick = (influencer: Influencer, e: React.MouseEvent) => {
    e.stopPropagation();
    const rank = getRank(influencer.id);
    setSelectedInfluencer({ influencer, rank });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Picks</h1>
          <p className="text-slate-600">
            {interestedInfluencers.length} Influencers Saved
          </p>
        </div>

        {interestedInfluencers.length > 0 && (
          <button
            onClick={() => setOrganizeByCategory(!organizeByCategory)}
            className="px-6 py-3 bg-white border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {organizeByCategory ? <LayoutGrid className="w-5 h-5" /> : <ListIcon className="w-5 h-5" />}
            {organizeByCategory ? 'Show All' : 'Filter by Category'}
          </button>
        )}
      </div>

      {/* Empty State */}
      {interestedInfluencers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Heart className="w-12 h-12 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No Influencers Yet</h3>
          <p className="text-slate-600 mb-6">
            Save and Compare Influencers you're interested in
          </p>
        </div>
      ) : organizeByCategory ? (
        /* Organized by Category */
        <div className="space-y-10">
          {Object.entries(groupedByCategory)
            .filter(([_, influencers]) => influencers.length > 0)
            .map(([category, categoryInfluencers]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 capitalize flex items-center gap-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                  {category}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryInfluencers.map((influencer) => (
                    <motion.div
                      key={influencer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img
                          src={influencer.photo}
                          alt={influencer.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        <button
                          onClick={() => toggleInterest(influencer.id)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all"
                        >
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        </button>
                      </div>

                      <div className="p-4 space-y-2">
                        <button
                          onClick={(e) => handleNameClick(influencer, e)}
                          className="font-bold text-lg text-slate-900 hover:text-purple-600 transition-colors text-left w-full"
                        >
                          {influencer.name}
                        </button>
                        <div className="text-sm text-slate-600">
                          {influencer.followers >= 1000
                            ? `${(influencer.followers / 1000).toFixed(1)}K`
                            : influencer.followers}{' '}
                          followers
                        </div>
                        <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold capitalize">
                          {influencer.category}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        /* All Influencers */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {interestedInfluencers.map((influencer) => (
            <motion.div
              key={influencer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={influencer.photo}
                  alt={influencer.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <button
                  onClick={() => toggleInterest(influencer.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all"
                >
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                <button
                  onClick={(e) => handleNameClick(influencer, e)}
                  className="font-bold text-lg text-slate-900 hover:text-purple-600 transition-colors text-left w-full"
                >
                  {influencer.name}
                </button>
                <div className="text-sm text-slate-600">
                  {influencer.followers >= 1000
                    ? `${(influencer.followers / 1000).toFixed(1)}K`
                    : influencer.followers}{' '}
                  followers
                </div>
                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold capitalize">
                  {influencer.category}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      {selectedInfluencer && (
        <InfluencerProfileModal
          influencer={selectedInfluencer.influencer}
          rank={selectedInfluencer.rank}
          onClose={() => setSelectedInfluencer(null)}
        />
      )}
    </div>
  );
}
