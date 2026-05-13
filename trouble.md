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

## 21. 추천 이유 토글을 개별 카드로 이동
- **변경 전**: 상단에 "추천 이유 보기" 토글 → 전체 카드에 한꺼번에 GPT 호출 (토큰 낭비)
- **변경 후**: 각 카드마다 "추천 이유 보기" 버튼 → 클릭한 인플루언서만 GPT 호출. 유사도/개인화/등급 3가지 점수 + 자연어 설명 표시

## 22. Home 화면 네비게이션 정리
- My/System Console을 맨 왼쪽으로 이동
- 로그아웃 버튼에서 텍스트 제거 (아이콘만)
- Recommendation 버튼 추가
- 로그인 전 화면에도 동일하게 Recommendation 추가

## 23. 로그아웃 시 화면 전환 안 됨
- **증상**: 로그아웃 눌러도 로그인된 화면에 머무름
- **원인**: `setIsAuthenticated(false)`만 하고 페이지 이동 없음
- **해결**: `window.location.href = '/'`로 강제 새로고침하여 로그인 전 화면으로 이동

---

# 기능 추가 및 수정사항

## A. 추천받기 필터 추가
- 추천받기 영역에 카테고리/팔로워 수 드롭다운 필터 추가
- 선택한 필터 값을 getPrediction API에 전달

## B. 챗봇 유저별 관리 + 새 채팅 기능
- ChatwootLog 모델에 user_id 컬럼 추가
- Webhook에서 sender.identifier를 user_id로 추출하여 저장
- 프론트에서 로그인 시 Chatwoot setUser 호출
- "새 채팅" 플로팅 버튼 추가

## C. 챗봇 대화 히스토리 기반 추천 개선
- 같은 conversation의 이전 추천 대화를 GPT에 전달하여 누적 선호 반영한 검색 쿼리 생성
- `_enhance_query_with_history` 메서드 추가

## D. 유저별 채팅 기록 조회 페이지
- GET /chatwoot/history/{user_id} API 추가
- /chat-history 페이지 (conversation별 그룹핑, 채팅 버블 형태)

## E. Chatwoot Rack::Attack 비활성화
- `chatwoot_rack_attack.rb` 파일로 영구 비활성화
- docker-compose.yml에 volume mount 추가

## F. Chatwoot HMAC 인증 적용
- GET /chatwoot/hmac/{user_id} API 추가
- 프론트에서 setUser 시 identifier_hash 전달

## G. 자체 채팅 UI 구현 (Chatwoot 위젯 제거)
- Chatwoot SDK 위젯 완전 제거
- ChatWidget.tsx: 플로팅 버튼 + 패널 (대화 목록/채팅창/새 채팅)
- 백엔드 /chat 프록시 API (conversations, messages, send, new)
- 3초 폴링으로 봇 응답 실시간 수신
- 질문 유형 선택 UI (인플루언서 추천 / 사이트 이용 관련)
- 대화 이름 수정 (연필 아이콘), 삭제 기능
- 비로그인 시 guest ID 발급 + 안내 문구 표시

## H. 추천 결과 상세 페이지
- /recommendation/:id 라우트 추가
- GET /recommendations/{run_id} API (user 권한 검증: 자기 추천만 접근, admin은 전체)
- 인플루언서 카드 형태로 순위/점수/카테고리 표시

## I. My 페이지 (유저 보드)
- /my 라우트 추가
- 프로필 편집: 이름, 쇼핑몰 이름, 쇼핑몰 URL 수정/저장
- 추천 기록 리스트 (클릭 시 상세 페이지 이동)
- 네비게이션: admin → System Console, user → My

## J. 쇼핑몰 분위기 분석 및 추천 반영
- User 모델에 mall_name, mall_url, mall_description 컬럼 추가
- mall_analyzer.py: URL 크롤링 + GPT 분위기 요약
- POST /auth/profile/{user_id}/analyze-mall API
- 추천 엔진에서 mall_description을 query_text에 자동 합침
- mall_url 있고 mall_description 없으면 추천 시 자동 분석
- mall_input 생성 시 User의 mall_name/mall_url 자동 채움

## K. 추천 임계값 기반 컷
- 유사도 점수 0.55 미만 제외
- 개인화 점수 0.3 미만 제외
- grade score는 정렬에만 사용 (컷 기준 아님)
- 개수 제한(top_k) 제거 → 임계값 통과한 전체 결과 반환

## L. 추천 점수 및 추천 이유 표기
- 각 추천 카드에 추천 점수 항상 표시
- 카드별 "추천 이유 보기" 버튼 (개별 GPT 호출)
- 유사도/개인화/등급 3가지 점수 + 자연어 설명 표시

## M. 챗봇에서 추천 결과 전체보기 연결
- 챗봇 추천 시 RecommendationRun DB 저장
- 상위 5명만 텍스트로 표시
- 하단에 "추천 결과 전체보기" 버튼 → /recommendation/{run_id}로 이동

## N. Find Influencers / Recommendation 페이지 분리
- /find = 검색/필터만
- /recommend = AI 추천 전용
- 네비게이션에 각각 버튼 추가

## O. 홈 화면 (/home)
- 로그인 후에도 접근 가능한 홈 화면 (로그인 버튼 대신 네비게이션)
- 독립 라우트로 등록 (AuthenticatedLayout 밖)
- 로고 클릭 시 /home으로 이동

## P. 로고 및 브랜딩
- logo_white.png, logo_black.png 적용
- 어두운 배경 → logo_black, 밝은 배경 → logo_white
- 텍스트 "LinkD-Match"로 통일
- favicon을 logo_white.png로 변경
- 브라우저 탭 제목 "LinkD-Match"로 변경

## Q. 히어로 타이틀 반응형
- clamp(1.75rem, 4vw, 3rem)으로 화면 크기에 따라 자동 조절
- "완벽한"과 "인플루언서를" 사이에 줄바꿈 추가

## R. 로그인 시 /my로 이동
- 로그인 성공 시 항상 /my 페이지로 이동

## S. 엔터키로 추천 실행
- 추천 입력창에서 Enter 누르면 바로 추천 실행

## T. 추천 결과 세부 점수 0으로 표시되는 버그
- **증상**: 추천 이유 보기 시 유사도/개인화/등급 점수가 전부 0
- **원인**: `RecommendationItemResponse` Pydantic 스키마에 `similarity_score`, `personalization_score`, `grade_score` 필드가 없어서 응답 직렬화 시 제거됨
- **해결**: 스키마에 3개 Optional 필드 추가

## U. 회원가입 시 쇼핑몰 정보 입력
- `UserCreate` 스키마에 `mall_name`, `mall_url` (Optional) 추가
- signup 라우터에서 해당 필드 저장
- SignupModal에 "쇼핑몰 정보 (선택)" 섹션 추가
- 모달 높이 초과 시 스크롤 가능하도록 `max-h-[90vh] overflow-y-auto` 적용

## V. Find Influencers 탭 제거 및 네비게이션 정리
- 모든 네비게이션(LandingPage, HomePage, AuthenticatedLayout)에서 Find Influencers 버튼 제거
- admin 계정도 My 페이지 접근 가능하도록 변경 (System Console + My 둘 다 표시)
- My 탭을 네비게이션 제일 오른쪽(로그아웃 버튼 바로 왼쪽)으로 이동
- 로그아웃 상태에서도 My 탭 표시
- Get Started / Start Your Journey 버튼을 /recommend로 연결

## W. Recommendation 페이지 UI 개선
- 필터를 select 드롭다운에서 버튼 토글 선택형으로 변경 (Find에서 쓰던 방식)
- 추천 전에도 기본 인플루언서 카드 20개 표시 ("인플루언서 둘러보기")
- 팔로워 수 필터에 직접 구간 입력(최소~최대) 필드 추가

## X. 기타 카테고리 제거
- 카테고리 API에서 "기타" 필터링하여 프론트에 반환하지 않도록 수정
- 해당 카테고리에 속한 인플루언서가 없어 불필요

## Y. 팔로워 수 필터 maxFollowers 미적용 버그
- **증상**: 1K-2K 필터 선택해도 5만, 9만 팔로워 인플루언서가 표시됨
- **원인**: 백엔드에 `minFollowers`만 전달하고 `maxFollowers`를 전달하지 않아 최소값 이상이면 전부 통과
- **해결**: 프론트/백엔드 모두 `maxFollowers` 파라미터 추가

## Z. 추천 필터를 클라이언트 사이드로 전환
- **변경 전**: 필터를 API 호출 시 전달 → 매번 추천 재실행 필요
- **변경 후**: 추천은 필터 없이 전체 결과를 받고, 필터는 클라이언트에서 즉시 적용
- 추천 결과 + 둘러보기 모두 동일하게 클라이언트 필터링
- 필터 변경 시 API 재호출 없이 실시간 반영

## AA. 팔로워 수 필터 범위 변경
- 기존: 500-1K / 1K-2K / 2K-3K / 3K-5K / 5K+
- 변경: 1K-5K / 5K-10K / 10K-30K / 30K-50K / 50K+

## AB. 추천 입력 placeholder 변경
- "브랜드 설명을 입력하세요" → "브랜드, 상품의 특징, 키워드, 원하는 분위기를 입력하세요"

## AC. 시간 표시 한국 시간(KST)으로 변경
- MyPage, RecommendationDetail, ChatHistory의 시간 표시에 `timeZone: "Asia/Seoul"` 적용
- 서버에서 timezone 없이 내려오는 UTC 값에 `+"Z"` 붙여서 강제 UTC 파싱 후 KST 변환

## AD. 추천 결과 모드 유지
- **증상**: 추천 후 필터를 걸면 결과 0개일 때 둘러보기로 전환됨
- **원인**: `filteredRecommendResults.length > 0` 조건으로 분기
- **해결**: `recommendResults.length > 0` (원본 결과 존재 여부)로 분기하여 추천 모드 유지

## AE. My 버튼 UI 개선
- UserCircle 아이콘 + 테두리 박스 스타일로 변경 (My Picks와 시각적 구분)
- 모든 네비게이션(LandingPage, HomePage, AuthenticatedLayout) 동일 적용
- My 버튼과 Login/Logout 아이콘 사이에 세로 구분선 추가

## AF. 필터 다중 선택 지원
- 카테고리: 다중 선택 가능 (OR 조건)
- 팔로워 수: 다중 선택 가능 (OR 조건)
- 스타일 키워드 필터 추가: 일상, 감성, 트렌드, 자연, 카페 등 15개 키워드 다중 선택

## AG. 둘러보기 전체 인플루언서 표시
- 기존 20개 고정 → 전체 인플루언서 대상 필터링 + 30개 단위 Load More 페이지네이션
