각 폴더안에 있는 README.md 에 진행 상황 다 적어놓기!
1) 

실시간 진행 상황
1) 윤지님이 프론트 서버 실행한 결과, 실제 인플루언서 데이터가 화면에 뜨는 것을 확인함
2) 그러나 프로필 이미지가 뜨지 않는 문제가 발생함
3) 인플루언서와 JPG 파일명을 매핑해서 쓰는 방식 채택 -> 현재는 2026-capstone-21/data/profile_pic_HD/ 에 위치하지만 매핑하기 위해서 2026-capstone-21/frontend/public/profile_pic_HD/ 로 위치 변경하기!  기다리는중...
4) frontend/src/api/influencer.ts 파일에 photo: `/profile_pic_HD/${item.username}.jpg`,  을   photo: `/profile_pic_HD/${item.username}.jpg`,  로 바꿔서
다시 테스트 진행해보기! 기다리는중...
  
  
  
  
  
  
  
  

