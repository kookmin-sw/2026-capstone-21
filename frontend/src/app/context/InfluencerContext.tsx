import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Influencer, SelectionHistory } from '../types';
import { mockSelectionHistory } from '../data/selectionHistory';
import { getInfluencers } from '../../api/influencer';
import { toggleFavorite } from '../../api/favorite';

interface InfluencerContextType {
  influencers: Influencer[];
  interestList: string[];
  selectionHistory: SelectionHistory[];
  notes: Record<string, string>;
  toggleInterest: (influencerId: string) => Promise<void>;
  selectInfluencer: (influencerId: string) => void;
  saveNote: (influencerId: string, note: string) => void;
}

const InfluencerContext = createContext<InfluencerContextType | undefined>(undefined);

export function InfluencerProvider({ children }: { children: ReactNode }) {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [interestList, setInterestList] = useState<string[]>([]);
  const [selectionHistory, setSelectionHistory] = useState<SelectionHistory[]>(mockSelectionHistory);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // 1. 인플루언서 API 연결
  useEffect(() => {
    getInfluencers()
      .then(setInfluencers)
      .catch(console.error);
  }, []);

  // 2. 관심 토글 (DB 연동 버전)
  const toggleInterest = async (influencerId: string) => {
    try {
      const result = await toggleFavorite(Number(influencerId));

      // 서버 기준 상태 반영 (토글 결과 기반)
      if (result.status === 'added') {
        setInterestList(prev => [...prev, influencerId]);
      } else {
        setInterestList(prev => prev.filter(id => id !== influencerId));
      }
    } catch (err) {
      console.error('favorite toggle 실패:', err);
    }
  };

  // 3. 선택 카운트 로직 (기존 유지)
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

  // 4. 노트 저장
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
