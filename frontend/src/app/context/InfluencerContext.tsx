import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Influencer, SelectionHistory } from '../types';
import { mockSelectionHistory } from '../data/selectionHistory';
import { getInfluencers } from '../../api/influencer';
import { getFavorites, toggleFavorite } from '../../api/favorite';
import { useAuth } from './AuthContext';

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
  const { isAuthenticated } = useAuth();

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [interestList, setInterestList] = useState<string[]>([]);
  const [selectionHistory, setSelectionHistory] = useState<SelectionHistory[]>(mockSelectionHistory);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // 1. 인플루언서 전체 목록 로딩
  useEffect(() => {
    getInfluencers()
      .then(setInfluencers)
      .catch(console.error);
  }, []);

  // 2. ⭐ 핵심: 로그인 상태 기준 favorite 동기화
  useEffect(() => {
    if (!isAuthenticated) {
      setInterestList([]);
      return;
    }

    getFavorites()
      .then((data) => {
        setInterestList(
          data.map((f: any) => String(f.influencer_id))
        );
      })
      .catch(console.error);
  }, [isAuthenticated]);

  // 3. 관심 토글 (DB 연동)
  const toggleInterest = async (influencerId: string) => {
    try {
      const res = await toggleFavorite(Number(influencerId));

      // 서버 결과 기준 동기화
      if (res.status === 'added') {
        setInterestList(prev => [...prev, influencerId]);
      } else {
        setInterestList(prev => prev.filter(id => id !== influencerId));
      }
    } catch (err) {
      console.error('toggleFavorite 실패:', err);
    }
  };

  // 4. 선택 카운트 (기존 로직 유지)
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

  // 5. 노트 저장
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

  if (!context) {
    throw new Error('useInfluencers must be used within InfluencerProvider');
  }

  return context;
}
