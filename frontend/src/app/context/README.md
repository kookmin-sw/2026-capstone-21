AuthContext.tsx 파일은 로그인 / 회원가입 / 관리자 상태 관리 을 담당
InfluencerContext.tsx 파일은 인플루언서 목록 관리 / 관심 목록 / 선택 기록 / 메모 기능 을 담당


현재 실시간 진행상황 적기
1) mockData.ts 파일 제거하고 실제 데이터로 연동 완료
2) API 연동하기 때문에 mockInfluencers는 필요 없어졌고, mockSelectionHistory로 파일 이름 바꿈
3) InfluencerContext.tsx 파일에서 
import { mockSelectionHistory } from '../data/mockData'; 을 import { mockSelectionHistory } from '../data/selectionHistory'; 로 바꿈
