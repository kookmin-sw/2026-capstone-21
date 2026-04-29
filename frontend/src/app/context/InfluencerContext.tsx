import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Influencer, SelectionHistory } from '../types';
import { mockSelectionHistory } from '../data/selectionHistory';
import { getInfluencers } from '../../api/influencer';

interface InfluencerContextType {
  influencers: Influencer[];
  selectionHistory: SelectionHistory[];
  notes: Record<string, string>;
  selectInfluencer: (influencerId: string) => void;
  saveNote: (influencerId: string, note: string) => void;
}

const InfluencerContext = createContext<InfluencerContextType | undefined>(undefined);

export function InfluencerProvider({ children }: { children: ReactNode }) {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectionHistory, setSelectionHistory] = useState<SelectionHistory[]>(mockSelectionHistory);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    getInfluencers()
      .then(setInfluencers)
      .catch(console.error);
  }, []);

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
        selectionHistory,
        notes,
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
