현재 실시간 진행상황 적기
1) mockData.ts 파일 제거하고 실제 데이터로 연동 완료
2) API 연동하기 때문에 mockInfluencers는 필요 없어졌고, mockSelectionHistory로 파일 이름 바꿈
3) InfluencerContext.tsx 파일에서 
import { mockSelectionHistory } from '../data/mockData'; 을 import { mockSelectionHistory } from '../data/selectionHistory'; 로 바꿈
