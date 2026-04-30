import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Instagram, FileText } from 'lucide-react';
import { useState } from 'react';
import { Influencer } from '../types';
import { useInfluencers } from '../context/InfluencerContext';
import { toggleFavorite, updateFavoriteMemo } from '../../api/favorite';

export function InfluencerProfileModal({ influencer, rank, onClose }) {
  const { interestList, toggleInterest } = useInfluencers();

  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const isInMyPicks = interestList.includes(influencer.id);

  const handleFavorite = async () => {
    await toggleFavorite(Number(influencer.id));
    toggleInterest(influencer.id);
  };

  const handleMemoClick = async () => {
    if (!isInMyPicks) {
      await handleFavorite();
    }
    setShowNoteInput(true);
  };

  const handleSave = async () => {
    await updateFavoriteMemo(Number(influencer.id), noteText);
    setShowNoteInput(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center">
        <div onClick={onClose} className="absolute inset-0 bg-black/60" />

        <div className="bg-white rounded-xl p-4 relative">
          <button onClick={onClose}><X /></button>

          <img src={influencer.photo} />

          <button onClick={handleFavorite}>
            <Star className={isInMyPicks ? "text-yellow-500" : ""} />
          </button>

          <button onClick={handleMemoClick}>
            <FileText /> 메모
          </button>

          {showNoteInput && (
            <>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button onClick={handleSave}>저장</button>
            </>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
