import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Influencer, SelectionHistory } from '../types';
import { mockSelectionHistory } from '../data/selectionHistory';
import { getInfluencers } from '../../api/influencer';
import { getFavorites, toggleFavorite } from '../../api/favorite';

interface InfluencerContextType {
  influencers: Influencer[];
  interestList: string[];
  selectionHistory: SelectionHistory[];
  notes: Record<string, string>;
  toggleInterest: (influencerId: string) => Promise<void>;
  selectInfluencer: (influencerId: string) => void;
  saveNote: (influencerId: string, note: string) => void;
  refreshFavorites: () => Promise<void>;
}

const InfluencerContext = createContext<InfluencerContextType | undefined>(undefined);

export function InfluencerProvider({ children }: { children: ReactNode }) {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [interestList, setInterestList] = useState<string[]>([]);
  const [selectionHistory, setSelectionHistory] = useState<SelectionHistory[]>(mockSelectionHistory);
  const [notes, setNotes] = useState<Record<string, string>>({});

  /* =========================
     1. influencers load
  ========================= */
  useEffect(() => {
    getInfluencers()
      .then(setInfluencers)
      .catch(console.error);
  }, []);

  /* =========================
     2. favorites load (LOGIN SYNC 핵심)
  ========================= */
  const refreshFavorites = async () => {
    try {
      const data = await getFavorites();

      setInterestList(
        data.map((f: any) => String(f.influencer_id))
      );
    } catch (err) {
      console.error("favorite sync 실패:", err);
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, []);

  /* =========================
     3. toggle favorite (DB 기준)
  ========================= */
  const toggleInterest = async (influencerId: string) => {
    try {
      const result = await toggleFavorite(Number(influencerId));

      if (result.status === 'added') {
        setInterestList(prev => [...prev, influencerId]);
      } else {
        setInterestList(prev => prev.filter(id => id !== influencerId));
      }
    } catch (err) {
      console.error('favorite toggle 실패:', err);
    }
  };

  /* =========================
     4. select influencer
  ========================= */
  const selectInfluencer = (influencerId: string) => {
    setInfluencers(prev =>
      prev.map(inf =>
        inf.id === influencerId
          ? { ...inf, selections: inf.selections + 1 }
          : inf
      )
    );

    const today = new Date().toISOString().split('T')[0];

    setSelectionHistory(prev => {
      const existing = prev.find(h => h.date === today);

      if (existing) {
        return prev.map(h =>
          h.date === today ? { ...h, count: h.count + 1 } : h
        );
      }

      return [...prev, { date: today, count: 1 }];
    });
  };

  const saveNote = (influencerId: string, note: string) => {
    setNotes(prev => ({
      ...prev,
      [influencerId]: note,
    }));
  };

  return (
    <InfluencerContext.Provider
      value={{
        influencers,
        interestList,
        selectionHistory,
        notes,
        toggleInterest,
        selectInfluencer,
        saveNote,
        refreshFavorites
      }}
    >
      {children}
    </InfluencerContext.Provider>
  );
}

export function useInfluencers() {
  const context = useContext(InfluencerContext);

  if (context === undefined) {
    throw new Error('useInfluencers must be used within InfluencerProvider');
  }

  return context;
}
