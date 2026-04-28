export interface Influencer {
  id: string;
  name: string;
  photo: string;
  followers: number;
  category: Category;
  mainGender: 'men' | 'women' | 'both';
  mainAge: AgeGroup;
  selections: number;
  instagram: string;
}

export type Category = 'beauty' | 'health' | 'travel' | 'home-deco' | 'it' | 'fashion' | 'parenting';

export type AgeGroup = '13-17' | '18-24' | '25-34' | '35-44' | '45+';

export type FollowerRange = '500-1000' | '1000-2000' | '2000-3000' | '3000-5000' | '5000+';

export interface FilterState {
  search: string;
  followerRange: FollowerRange | null;
  categories: Category[];
  mainGender: 'men' | 'women' | 'both' | null;
  mainAges: AgeGroup[];
}

export interface SelectionHistory {
  date: string;
  count: number;
}
