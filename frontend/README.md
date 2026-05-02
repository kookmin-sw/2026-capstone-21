<frontend/src/app/components/InfluencerProfileModal.tsx>
: 인플루언서 상세 모달 + 관심(즐겨찾기) + 메모 기능 처리하는 컴포넌트.
인플루언서를 클릭했을 때 뜨는 상세 팝업(모달), 즐겨찾기 추가/제거 ⭐  메모 작성 📝  모달 닫기 ❌

<2026-capstone-21/frontend/src/app/context/AuthContext.tsx>
:전체 앱에서 로그인/회원가입/로그아웃 상태를 관리하는 인증 시스템의 중심(Context).
전역 상태 + API 호출 + 사용자 정보 저장까지 다 담당하는 핵심 구조.

<frontend/src/app/components/AuthenticatedLayout.tsx>
: 로그인 이후 화면 전체 레이아웃 + 페이지 전환 컨트롤러.
profile	인플루언서 탐색,  interest	즐겨찾기,  statistics 통계,  system-console 을 볼 수 있음.

로그인/회원가입 기능 구현 중

수정해야 할 사항 <br>
1.인플루언서 카드 / 메모 기능 연동 관련
현재 메모 기능은 ‘관심 등록 이유’ 개념으로 구현되어 있어,
메모를 작성하면 자동으로 관심 목록에 추가되고,
관심 목록에서 삭제하면 메모도 함께 삭제되는 구조
→ 이 구조를 유지할지, 메모를 독립적으로 분리할지 추가 논의 필요 <br>

2. 추천 받는 부분 필터 적용 + UI 개선




  
  
  
  
  
  
  

