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
  const [selectionHistory, setSelectionHistory] =
    useState<SelectionHistory[]>(mockSelectionHistory);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // 1. 인플루언서 목록 불러오기
  useEffect(() => {
    getInfluencers()
      .then((data) => {
        console.log('🔥 FRONT DATA:', data);
        setInfluencers(data);
      })
      .catch(console.error);
  }, []);

  // 2. 관심 목록 불러오기
  const refreshFavorites = async () => {
    try {
      const data = await getFavorites();
      setInterestList(data.map((f: any) => String(f.influencer_id)));
    } catch (err) {
      console.error('favorite sync 실패:', err);
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, []);

  // 3. 관심 토글
  const toggleInterest = async (influencerId: string) => {
    try {
      const result = await toggleFavorite(Number(influencerId));

      if (result.status === 'added') {
        setInterestList((prev) => [...prev, influencerId]);
      } else {
        setInterestList((prev) =>
          prev.filter((id) => id !== influencerId)
        );
      }
    } catch (err) {
      console.error('favorite toggle 실패:', err);
    }
  };

  // 4. 선택 증가
  const selectInfluencer = (influencerId: string) => {
    setInfluencers((prev) =>
      prev.map((inf) =>
        inf.id === influencerId
          ? { ...inf, selections: inf.selections + 1 }
          : inf
      )
    );
  };

  // 메모 저장 (프론트 상태)
  const saveNote = (influencerId: string, note: string) => {
    setNotes((prev) => ({
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

  if (!context) {
    throw new Error('useInfluencers must be used within InfluencerProvider');
  }

  return context;
}
