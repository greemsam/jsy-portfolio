# 관리자 로그인 설정

관리자 페이지와 모든 관리 API는 Firebase 세션 쿠키와 서버의 UID 허용 목록을 검사합니다. 설정이 없으면 관리 접근은 거부됩니다. localhost 우회는 없습니다.

1. Firebase Console → Authentication → Sign-in method에서 Google 제공업체를 활성화하고 지원 이메일을 지정합니다.
2. Authentication → Settings → Authorized domains에 실제 배포 도메인을 추가합니다. 로컬 개발용 localhost도 필요하면 추가합니다.
3. 프로젝트 설정 → 일반 → 웹 앱의 Firebase 설정에서 아래 공개 설정값을 가져옵니다. 웹 앱이 없으면 등록합니다. 기존 Admin SDK와 동일한 프로젝트를 사용합니다.
4. `.env.local`과 배포 서비스 환경 변수에 다음을 설정합니다.

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=웹앱의_apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=프로젝트.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=프로젝트_ID
ADMIN_UIDS=허용할_Firebase_사용자_UID
ADMIN_APP_ORIGIN=https://실제-배포-도메인
```

`ADMIN_APP_ORIGIN`은 경로와 마지막 슬래시 없는 정확한 origin입니다. 로컬에서는 `http://localhost:3000`을 사용합니다. 개발 모드에서 생략하면 현재 서버 origin으로 제한하며, 운영 모드에서 생략하면 로그인·수정 요청을 거부합니다.

5. `/admin/login`에서 본인의 Google 계정으로 로그인합니다. 최초에는 UID 허용 목록이 없어 접근 거부되는 것이 정상입니다. Firebase Console → Authentication → Users에 생성된 본인 계정의 UID를 확인해 `ADMIN_UIDS`에 입력합니다. 여러 UID는 쉼표로 구분합니다.
6. 개발 서버를 다시 시작하고 배포 환경은 재빌드/재배포한 후 로그인합니다. 허용 목록을 얻기 위해 임시로 인증 검사를 끄지 마세요.

세션은 8시간이며 HttpOnly, SameSite=Strict, 운영 환경 Secure 쿠키입니다. 매 요청마다 세션 취소 여부와 현재 UID 허용 목록을 검사합니다. 로그인·변경 요청은 Origin을 검사합니다. 다른 사이트에서 관리자 API를 호출하는 구성은 허용하지 않습니다.

Firebase Admin 서비스 계정 키는 서버 환경 변수에만 보관합니다. `NEXT_PUBLIC_`에 서비스 계정 키를 넣지 마세요. 공개 웹 설정은 비밀 키가 아닙니다. 관리자 Google 계정에는 2단계 인증을 설정하세요.

비로그인 `/api/posts` 응답은 공개 작품만 포함합니다. 공개 여부 변경은 Storage URL 접근 권한을 회수하지 않습니다. 이미 알고 있는 다운로드 URL까지 차단해야 한다면 별도 Storage 접근 정책과 이미지 제공 경로가 필요합니다.

배포 후 로그아웃 상태에서 `/admin`이 로그인으로 이동하는지, 관리 API가 거부되는지, 허용되지 않은 Google 계정이 거부되는지 확인하세요. 로그인 후 등록·수정·삭제·미리보기·로그아웃도 확인합니다.
