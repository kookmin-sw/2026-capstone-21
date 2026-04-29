import { motion, AnimatePresence } from 'motion/react';import { X, Star, Instagram, FileText } from 'lucide-react';import { useState } from 'react';import { Influencer } from '../types';import { useInfluencers } from '../context/InfluencerContext';

interface InfluencerProfileModalProps {influencer: Influencer;rank: number;onClose: () => void;}

export function InfluencerProfileModal({ influencer, rank, onClose }: InfluencerProfileModalProps) {const { interestList, toggleInterest, notes, saveNote } = useInfluencers();const [showNoteInput, setShowNoteInput] = useState(false);const [noteText, setNoteText] = useState(notes[influencer.id] || '');

const isInMyPicks = interestList.includes(influencer.id);

const handleSaveNote = () => {saveNote(influencer.id, noteText);setShowNoteInput(false);};

return ({/* Backdrop */}<motion.divinitial={{ opacity: 0 }}animate={{ opacity: 1 }}exit={{ opacity: 0 }}onClick={onClose}className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>

    {/* Modal - Influencer Card */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Close Button - Outside Card */}
      <button
        onClick={onClose}
        className="absolute -top-4 -right-4 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors"
      >
        <X className="w-6 h-6 text-slate-900" />
      </button>

      {/* Rank Badge - Outside Card */}
      <div className="absolute -top-4 -left-4 z-10 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
        {rank}
      </div>

      {/* Card - Same design as Profile page */}
      <div className="w-80 bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Photo - 70% */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={influencer.photo}
            alt={influencer.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Star Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleInterest(influencer.id);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all"
          >
            <Star
              className={`w-5 h-5 ${
                interestList.includes(influencer.id)
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Info - 30% */}
        <div className="p-4 space-y-2">
          <h3 className="font-bold text-lg text-slate-900">{influencer.name}</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {influencer.followers >= 1000
                ? `${(influencer.followers / 1000).toFixed(1)}K`
                : influencer.followers}{' '}
              followers
            </span>
          </div>
          <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold capitalize">
            {influencer.category}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <a
                href={`https://instagram.com/${influencer.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-purple-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Instagram className="w-4 h-4" />
              </a>
              <span className="text-sm text-slate-600">@{influencer.instagram}</span>
            </div>
            {isInMyPicks && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNoteInput(!showNoteInput);
                }}
                className="text-slate-600 hover:text-purple-600 transition-colors"
                title="Add note"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
          </div>
          {isInMyPicks && showNoteInput && (
            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add your note here..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNote}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowNoteInput(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {isInMyPicks && notes[influencer.id] && !showNoteInput && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{notes[influencer.id]}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNoteInput(true);
                }}
                className="text-xs text-purple-600 hover:text-purple-700 mt-2"
              >
                Edit note
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  </div>
</AnimatePresence>
