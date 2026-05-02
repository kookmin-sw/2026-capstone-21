export interface Influencer {
  id: string;
  name: string;
  username?: string;
  photo: string;
  followers: number;
  category: Category;
  mainGender: 'men' | 'women' | 'both';
  mainAge: AgeGroup;
  selections: number;
  gradeScore: number;
  instagram: string;
  styleKeywords: string[];
}

export type Category = '패션' | '뷰티' | '인테리어' | '리빙' | '푸드·맛집' | '여행' | '헬스·웰니스' | '육아·가족' | '반려동물' | '라이프스타일';

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
