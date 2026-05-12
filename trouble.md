# Trouble Shooting 기록

## 1. Chatwoot 위젯 429 (Too Many Requests)
- **증상**: 챗봇 아이콘이 안 뜨고 콘솔에 `429 Too Many Requests` 에러
- **원인**: Rack::Attack이 유저 IP를 rate limit으로 차단
- **해결**: 
  - Chatwoot 컨테이너 재시작으로 임시 해제
  - 영구 해결: `chatwoot_rack_attack.rb` 파일로 `Rack::Attack.enabled = false` 설정 후 volume mount

## 2. Chatwoot API로 incoming 메시지 전송 불가
- **증상**: 자체 채팅 UI에서 메시지 보내도 봇 응답이 안 옴
- **원인**: Chatwoot API에서 `message_type: "incoming"`은 API inbox에서만 허용, WebWidget inbox에서는 차단됨
- **해결**: 메시지를 Chatwoot API로 보내지 않고, 백엔드에서 직접 chatbot service를 호출하여 응답 생성 후 outgoing으로 기록

## 3. 새 채팅 기능 오작동 (`$chatwoot.reset()`)
- **증상**: 새 채팅 버튼 누르면 세션이 완전히 날아가고 기존 대화에 계속 붙음
- **원인**: `$chatwoot.reset()`이 쿠키/세션을 삭제하여 새 anonymous contact 생성 → 기존 contact와 분리
- **해결**: reset() 대신 백엔드 API로 열린 대화를 resolve한 후 위젯 재오픈 → 이후 자체 채팅 UI로 전환하여 근본 해결

## 4. Python 3.9 타입 힌트 호환성
- **증상**: 백엔드 컨테이너 시작 실패 - `TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'`
- **원인**: `int | None` 문법은 Python 3.10+에서만 지원, 컨테이너는 Python 3.9
- **해결**: `Optional[int]`으로 변경

## 5. BeautifulSoup 모듈 없음
- **증상**: 쇼핑몰 분석 시 500 에러 - `ModuleNotFoundError: No module named 'bs4'`
- **원인**: `beautifulsoup4`가 requirements.txt에 없었음
- **해결**: `requirements.txt`에 `beautifulsoup4==4.12.3` 추가 후 이미지 재빌드

## 6. 쇼핑몰 분석 400 Bad Request
- **증상**: 분석 버튼 눌러도 결과 안 뜸
- **원인**: 프론트에서 URL을 입력만 하고 저장(PUT) 안 한 상태에서 분석 API 호출 → DB에 mall_url이 null
- **해결**: 분석 버튼 클릭 시 먼저 프로필 저장(PUT) 후 분석 API 호출하도록 순서 변경

## 7. 추천 시 질문 유형 메시지가 바로 추천 실행
- **증상**: 새 채팅에서 질문 유형 선택하면 아무 질문도 안 했는데 추천 결과가 나옴
- **원인**: "인플루언서 추천" 텍스트를 첫 메시지로 전송 → 챗봇이 추천 요청으로 인식
- **해결**: 질문 유형은 conversation의 `custom_attributes`에만 설정하고, 메시지로 보내지 않도록 변경

## 8. 로그인 후 My 페이지로 이동 안 됨
- **증상**: 로그인해도 이전 페이지에 머무름
- **원인**: Root.tsx의 useEffect가 이미 인증된 상태에서는 트리거 안 됨
- **해결**: LandingPage의 `handleLoginSuccess`에서 `window.location.href = '/my'`로 강제 이동

## 9. Chatwoot webhook router 중복 선언
- **증상**: `/chatwoot/hmac/{user_id}` 엔드포인트가 등록 안 됨
- **원인**: `router = APIRouter(...)` 가 파일 내에서 두 번 선언되어 첫 번째 라우터가 덮어씌워짐
- **해결**: 중복 선언 제거

## 10. 추천 결과 개수가 항상 고정 (5278명 표시)
- **증상**: 임계값 컷을 적용했는데도 화면에 5278명 그대로 표시
- **원인**: 추천 결과 아래에 전체 인플루언서 검색 목록이 항상 표시되고 있었음
- **해결**: 추천 결과가 있을 때는 검색/필터/전체 목록을 숨기고, 추천 결과만 표시하도록 조건부 렌더링 적용

## 11. 추천 결과 DB 저장 20개 제한
- **증상**: 임계값 통과한 59개 중 20개만 저장/표시됨
- **원인**: predict 엔드포인트에 `if len(final_results) == 20: break` 하드코딩
- **해결**: 20개 제한 제거, 임계값 통과한 전체 결과 저장. 프론트에서 30개 단위 Load More로 표시

## 12. /home 페이지 배경이 흰색으로 조잡하게 표시
- **증상**: 로그인 후 /home 접근 시 흰색 배경이 깔림
- **원인**: `/home`이 `AuthenticatedLayout`의 children으로 등록되어 흰색 배경 레이아웃이 감싸고 있었음
- **해결**: `/home` 라우트를 Root children 밖으로 빼서 독립 라우트로 등록

## 13. 챗봇 새 채팅 생성 시 "contact not found"
- **증상**: 새 채팅 만들기 시 대화가 생성되지 않음
- **원인**: `_get_contact_id`에서 contact가 없을 때 guest만 생성하고 일반 유저는 생성하지 않았음. Chatwoot에 identifier로 등록된 contact가 없는 유저는 대화 생성 불가
- **해결**: guest/일반 유저 구분 없이 contact가 없으면 자동 생성하도록 수정

## 14. 챗봇 인플루언서 추천 탭에서 질문 유형이 "일반"으로 처리됨
- **증상**: 인플루언서 추천 탭에서 질문해도 "이용 안내 문서에 없습니다" 응답
- **원인**: 새 대화 생성 시 `question_type`을 Chatwoot `custom_attributes`에만 설정했는데, `/chat/send`에서 이를 읽지 않고 항상 `"일반"`으로 처리
- **해결**: `/chat/send`에서 conversation의 `custom_attributes.question_type`을 조회하여 사용하도록 수정

## 15. 디스크 공간 부족으로 Docker 빌드 실패
- **증상**: `no space left on device` 에러로 빌드 불가
- **원인**: Docker 이미지/빌드 캐시가 디스크를 가득 채움
- **해결**: `docker system prune -f && docker builder prune -f`로 7.7GB 확보

## 16. 챗봇 추천 결과에서 전체보기 링크 연결
- **증상**: 챗봇에서 추천 받아도 전체 결과 페이지로 이동할 방법 없음
- **원인**: chatbot service에서 RecommendationRun을 저장하지 않아 run_id가 없었음
- **해결**: `_build_influencer_recommendation_answer`에서 MallInput + RecommendationRun + RecommendationResult를 DB에 저장하고, 응답 끝에 `[추천 결과 전체보기](/recommendation/{run_id})` 링크 추가. 프론트 ChatWidget에서 마크다운 링크 패턴을 감지하여 버튼으로 렌더링

## 17. 챗봇 대화상자에서 긴 URL이 넘침
- **증상**: 인스타그램 프로필 URL 등 긴 텍스트가 채팅 버블을 벗어남
- **원인**: `whitespace-pre-wrap`만 있고 단어 단위 줄바꿈 처리 없음
- **해결**: 메시지 버블에 `break-all` 클래스 추가

## 18. 채팅 헤더에 "대화 #55" 그대로 표시
- **증상**: 채팅방에 들어가면 헤더에 ID 기반 이름이 표시됨
- **원인**: 헤더에서 conversation name을 사용하지 않고 `activeConvId`를 직접 표시
- **해결**: `conversations.find()`로 해당 대화의 name을 가져와서 표시 (없으면 "새로운 채팅")

## 19. 채팅 이름 수정 방법이 불명확 (더블클릭)
- **증상**: 유저가 채팅 이름 수정 방법을 모름
- **원인**: 더블클릭으로만 수정 가능했음
- **해결**: 대화 목록 각 항목에 연필(Pencil) 아이콘 버튼 추가, 클릭 시 prompt로 이름 수정

## 20. Find Influencers와 Recommendation 페이지 분리
- **증상**: 검색과 추천이 같은 페이지에 혼재
- **원인**: `InfluencerProfile.tsx`에 검색+추천이 모두 포함
- **해결**: `/find` = 검색/필터만, `/recommend` = AI 추천 전용 페이지로 분리. 네비게이션에 "Find Influencers"와 "Recommendation" 버튼 각각 추가
