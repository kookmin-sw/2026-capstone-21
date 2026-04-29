import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Instagram, FileText } from 'lucide-react';
import { useState } from 'react';
import { Influencer } from '../types';
import { useInfluencers } from '../context/InfluencerContext';

interface InfluencerProfileModalProps {
  influencer: Influencer;
  rank: number;
  onClose: () => void;
}

export function InfluencerProfileModal({
  influencer,
  rank,
  onClose,
}: InfluencerProfileModalProps) {
  const { interestList, toggleInterest, notes, saveNote } = useInfluencers();

  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(notes[influencer.id] || '');

  const isInMyPicks = interestList.includes(influencer.id);

  const handleSaveNote = () => {
    saveNote(influencer.id, noteText);
    setShowNoteInput(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 z-10 p-3 bg-white rounded-full shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Rank */}
          <div className="absolute -top-4 -left-4 z-10 w-14 h-14 rounded-full bg-purple-500 text-white flex items-center justify-center text-xl">
            {rank}
          </div>

          {/* Card */}
          <div className="w-80 bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* Image */}
            <div className="relative aspect-[3/4]">
              <img
                src={influencer.photo}
                className="w-full h-full object-cover"
              />

              {/* Star */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleInterest(influencer.id);
                }}
                className="absolute top-3 right-3 p-2 bg-white rounded-full"
              >
                <Star
                  className={`w-5 h-5 ${
                    isInMyPicks
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-500'
                  }`}
                />
              </button>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-bold">{influencer.name}</h3>

              <p className="text-sm text-gray-500">
                {influencer.followers} followers
              </p>

              <p className="text-sm text-purple-500">
                {influencer.category}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <Instagram className="w-4 h-4" />
                <span>@{influencer.instagram}</span>
              </div>

              {/* 메모 버튼 */}
              {isInMyPicks && (
                <button
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="mt-2"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}

              {/* 메모 입력 */}
              {isInMyPicks && showNoteInput && (
                <div className="mt-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full border p-2"
                  />

                  <button onClick={handleSaveNote}>Save</button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}