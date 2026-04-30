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

수정해야 할 사항 (인플루언서 카드 / 메모 기능 연동 관련)
1. 카드 클릭 후 모달 내부에서 별표(관심 등록)를 눌렀을 때,
모달 외부 카드의 별표 상태가 즉시 반영되지 않고 새로고침 이후에 반영되는 문제
→ 상태 동기화 처리 필요
2. 프로필 이미지가 표시되지 않는 문제
3. 메모 입력 및 저장은 되지만, 다시 모달을 열었을 때 기존 메모가 유지되지 않고 사라지는 문제
→ 기존 메모 데이터를 불러오는 로직 추가 필요
4. 카메라(Instagram) 아이콘 클릭 시 해당 인플루언서의 인스타 계정으로 이동하도록 연결 필요
5. 현재 메모 기능은 ‘관심 등록 이유’ 개념으로 구현되어 있어,
메모를 작성하면 자동으로 관심 목록에 추가되고,
관심 목록에서 삭제하면 메모도 함께 삭제되는 구조
→ 이 구조를 유지할지, 메모를 독립적으로 분리할지 추가 논의 필요 <br>

1. favorite API 연동 코드 위치
- frontend/src/api/favorite.ts
- 백엔드 /favorites API를 fetch로 호출하는 함수들이 정의되어 있음
  예: toggleFavorite, getFavorites, addFavorite, updateFavoriteMemo

2. 프론트에서 실제 호출하는 위치
- frontend/src/app/components/InfluencerProfileModal.tsx
- 메모 저장 시 updateFavoriteMemo(...), addFavorite(...) 호출

3. 전체 흐름<br>
사용자 클릭
→ InfluencerProfileModal.tsx
→ favorite.ts의 fetch 함수 실행
→ http://localhost:8000/favorites API 요청
→ FastAPI router/favorite.py에서 요청 처리
→ DB 저장

  
  
  
  
  
  
  

