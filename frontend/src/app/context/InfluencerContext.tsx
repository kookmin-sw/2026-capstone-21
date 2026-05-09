import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Influencer, SelectionHistory } from '../types';
import { mockSelectionHistory } from '../data/selectionHistory';
import { getInfluencers } from '../../api/influencer';
import {
  getFavorites,
  toggleFavorite,
  updateFavoriteMemo,
  addFavorite,
} from '../../api/favorite';

interface InfluencerContextType {
  influencers: Influencer[];
  interestList: string[];
  selectionHistory: SelectionHistory[];
  notes: Record<string, string>;
  toggleInterest: (influencerId: string) => Promise<'added' | 'removed'>;
  selectInfluencer: (influencerId: string) => void;
  saveNote: (influencerId: string, note: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const InfluencerContext = createContext<InfluencerContextType | undefined>(
  undefined
);

export function InfluencerProvider({ children }: { children: ReactNode }) {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [interestList, setInterestList] = useState<string[]>([]);
  const [selectionHistory, setSelectionHistory] =
    useState<SelectionHistory[]>(mockSelectionHistory);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    getInfluencers()
      .then((data) => {
        console.log('🔥 FRONT DATA:', data);
        setInfluencers(data);
      })
      .catch(console.error);
  }, []);

  const refreshFavorites = async () => {
    try {
      const data = await getFavorites();

      setInterestList(data.map((f: any) => String(f.influencer_id)));

      const nextNotes: Record<string, string> = {};

      data.forEach((fav: any) => {
        nextNotes[String(fav.influencer_id)] = fav.reason || '';
      });

      setNotes(nextNotes);
    } catch (err) {
      console.error('favorite sync 실패:', err);
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, []);

  const toggleInterest = async (
    influencerId: string
  ): Promise<'added' | 'removed'> => {
    try {
      const id = String(influencerId);
      const result = await toggleFavorite(Number(id));

      if (result.status === 'added') {
        setInterestList((prev) => (prev.includes(id) ? prev : [id, ...prev]));
        return 'added';
      }

      setInterestList((prev) => prev.filter((item) => item !== id));

      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      return 'removed';
    } catch (err) {
      console.error('favorite toggle 실패:', err);
      throw err;
    }
  };

  const selectInfluencer = (influencerId: string) => {
    setInfluencers((prev) =>
      prev.map((inf) =>
        String(inf.id) === String(influencerId)
          ? { ...inf, selections: inf.selections + 1 }
          : inf
      )
    );
  };

  const saveNote = async (influencerId: string, note: string) => {
    const id = String(influencerId);
    const numericId = Number(id);

    try {
      try {
        await updateFavoriteMemo(numericId, note);
      } catch {
        await addFavorite(numericId, note);

        setInterestList((prev) => (prev.includes(id) ? prev : [id, ...prev]));
      }

      setNotes((prev) => ({
        ...prev,
        [id]: note,
      }));
    } catch (err) {
      console.error('note save 실패:', err);
      throw err;
    }
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