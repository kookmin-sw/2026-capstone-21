frontend/src/app/components/InfluencerProfileModal.tsx <<< 프론트엔드에서 API랑 직접 관련된 파일이 아니라 UI 컴포넌트



<진행 상황 다 적어놓기>
1) influencers  api 연동 끝
2) category   api 연동 끝
3) favorite   api 연동 끝

실시간 진행 상황
1) 윤지님이 프론트 서버 실행한 결과, 실제 인플루언서 데이터가 화면에 뜨는 것을 확인함. 그러나 프로필 이미지가 뜨지 않는 문제가 발생함.
2) 인플루언서와 JPG 파일명을 매핑해서 쓰는 방식 채택 -> 현재는 2026-capstone-21/data/profile_pic_HD/ 에 위치하지만 매핑하기 위해서 2026-capstone-21/frontend/public/profile_pic_HD/ 로 위치 변경하기!  (해결하면 괄호 지우기)
3) frontend/src/api/influencer.ts 파일에 photo: `/profile_pic_HD/${item.username}.jpg`,  을   photo: `/profile_pic_HD/${item.username}.jpg`,  로 바꿨음.
2)번 진행 후에 다시 테스트 진행해보기!   (해결하면 괄호 지우기)


4) 2026-capstone-21/frontend/src/app/components/InfluencerProfile.tsx 가 카테고리를 담당하고 있기 때문에 수정함.
2026-capstone-21/frontend/src/api/category.ts 파일도 수정함.  --> 지금 상태면 카테고리 API 연결 자체 는 끝난 상태.
이제부터는 단순 연결이 아니라 기능이 실제로 제대로 동작하는지 테스트 진행해보기! 
5) 2026-capstone-21/frontend/src/app/context/InfluencerContext.tsx 가 관심목록을 담당하고 있기 때문에 수정함.  --> favorite api 연결 자체  는 끝난 상태.
6) insight api 연동 진행중 -> 2026-capstone-21/frontend/src/app/components/CompareInfluencers.tsx 에서 DB 기준 grade_score / followers, backend ranking 기반 계산
   추가해서 수정함.
  
  
  
  
  
  
  
  

