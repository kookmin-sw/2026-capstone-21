import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Instagram, FileText } from 'lucide-react';
import { useState } from 'react';
import { Influencer } from '../types';
import { useInfluencers } from '../context/InfluencerContext';

interface InfluencerProfileModalProps {
  influencer: Influencer;
  onClose: () => void;
}

export function InfluencerProfileModal({
  influencer,
  onClose,
}: InfluencerProfileModalProps) {
  const {
    interestList,
    notes,
    toggleInterest,
    saveNote,
  } = useInfluencers();

  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const influencerId = String(influencer.id);
  const isInMyPicks = interestList.includes(influencerId);

  const handleFavorite = async () => {
    await toggleInterest(influencerId);
  };

  const handleMemoClick = async () => {
    if (!isInMyPicks) {
      await handleFavorite();
    }

    setNoteText(notes[influencerId] || '');
    setShowNoteInput(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      await saveNote(influencerId, noteText);

      setShowNoteInput(false);
      alert('메모가 저장되었습니다.');
    } catch (error) {
      console.error('메모 저장 실패:', error);
      alert('메모 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-[300px] bg-white rounded-2xl shadow-2xl overflow-visible"
        >
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 transition"
          >
            <X className="w-6 h-6 text-slate-900" />
          </button>

          <button
            onClick={handleFavorite}
            className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-yellow-50 transition"
          >
            <Star
              className={`w-5 h-5 ${
                isInMyPicks
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-slate-600'
              }`}
            />
          </button>

          <div className="h-[210px] bg-gradient-to-b from-slate-100 to-slate-300 overflow-hidden rounded-t-2xl">
            <img
              src={influencer.photo}
              alt={influencer.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  '/default-profile.png';
              }}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-4 space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {influencer.name}
            </h2>

            <p className="text-sm text-slate-600">
              {influencer.followers.toLocaleString()} followers
            </p>

            {influencer.category && (
              <span className="inline-flex px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold text-xs">
                {influencer.category}
              </span>
            )}

            {notes[influencerId] && !showNoteInput && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                {notes[influencerId]}
              </p>
            )}

            <div className="flex items-center gap-3 text-slate-600 text-sm pt-1">
              {influencer.username && (
                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      `https://www.instagram.com/${influencer.username}`,
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }}
                  className="flex items-center gap-1 hover:text-pink-600 transition"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{influencer.username}</span>
                </button>
              )}

              <button
                onClick={handleMemoClick}
                className="flex items-center gap-1 hover:text-purple-600 transition"
              >
                <FileText className="w-4 h-4" />
                <span>메모</span>
              </button>
            </div>

            {showNoteInput && (
              <div className="space-y-2 pt-1">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="메모를 입력하세요"
                  className="w-full h-14 border border-purple-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-3 py-1 rounded-md bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>

                  <button
                    onClick={() => setShowNoteInput(false)}
                    className="px-3 py-1 rounded-md bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
