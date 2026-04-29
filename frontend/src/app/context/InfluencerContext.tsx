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

  // ✔ 1. 인플루언서 로딩
  useEffect(() => {
    getInfluencers().then(setInfluencers).catch(console.error);
  }, []);

  // ✔ 2. 로그인 후 favorite 동기화 핵심
  const refreshFavorites = async () => {
    try {
      const data = await getFavorites();

      setInterestList(
        data.map((f: any) => String(f.influencer_id))
      );
    } catch (err) {
      console.error('favorite sync 실패:', err);
    }
  };

  // ✔ 3. 관심 토글 (DB 기반)
  const toggleInterest = async (influencerId: string) => {
    try {
      const result = await toggleFavorite(Number(influencerId));

      if (result.status === 'added') {
        setInterestList(prev => [...prev, influencerId]);
      } else {
        setInterestList(prev => prev.filter(id => id !== influencerId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectInfluencer = (influencerId: string) => {
    setInfluencers(prev =>
      prev.map(inf =>
        inf.id === influencerId
          ? { ...inf, selections: inf.selections + 1 }
          : inf
      )
    );
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
        refreshFavorites,
      }}
    >
      {children}
    </InfluencerContext.Provider>
  );
}

export function useInfluencers() {
  const context = useContext(InfluencerContext);
  if (!context) throw new Error('useInfluencers must be used within Provider');
  return context;
}
