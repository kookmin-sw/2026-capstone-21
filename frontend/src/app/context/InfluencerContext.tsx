import { createContext, useContext, useState, ReactNode } from 'react';
import { Influencer, SelectionHistory } from '../types';
import { mockInfluencers, mockSelectionHistory } from '../data/mockData';

interface InfluencerContextType {
  influencers: Influencer[];
  interestList: string[];
  selectionHistory: SelectionHistory[];
  notes: Record<string, string>;
  toggleInterest: (influencerId: string) => void;
  selectInfluencer: (influencerId: string) => void;
  saveNote: (influencerId: string, note: string) => void;
}

const InfluencerContext = createContext<InfluencerContextType | undefined>(undefined);

export function InfluencerProvider({ children }: { children: ReactNode }) {
  const [influencers, setInfluencers] = useState<Influencer[]>(mockInfluencers);
  const [interestList, setInterestList] = useState<string[]>([]);
  const [selectionHistory, setSelectionHistory] = useState<SelectionHistory[]>(mockSelectionHistory);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const toggleInterest = (influencerId: string) => {
    setInterestList(prev =>
      prev.includes(influencerId)
        ? prev.filter(id => id !== influencerId)
        : [...prev, influencerId]
    );
  };

  const selectInfluencer = (influencerId: string) => {
    setInfluencers(prev =>
      prev.map(inf =>
        inf.id === influencerId
          ? { ...inf, selections: inf.selections + 1 }
          : inf
      )
    );

    // Update today's selection count
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
