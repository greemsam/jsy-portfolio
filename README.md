# JSY Portfolio

방문자용 Next.js 작품 갤러리입니다. 관리자는 독립 프로젝트 `../jsy-portfolio-admin`으로 분리했습니다.

## 실행

```sh
npm ci
npm run dev
```

공개 서비스: http://localhost:3000
관리자 프로젝트: http://localhost:3001/admin

## 설정

`.env.example`을 참고해 `.env.local`에 Firebase 서버 자격 증명을 설정합니다. 관리자와 같은 Firebase 프로젝트의 `posts` 컬렉션 및 기존 이미지 URL을 사용합니다. 서비스에는 Google Drive·로그인·이미지 업로드 설정이 필요하지 않습니다. 기존 `.env.local`은 유지했으며 사용하지 않는 관리자 설정은 제거해도 됩니다. 서비스 계정은 서버 전용이며 브라우저에 노출하지 않습니다. 기존 자격 증명의 IAM 권한 자체를 변경한 것은 아닙니다.

## 앱 경계

- `/`: 작품 갤러리
- `GET /api/home`: 최신 공개 작품
- `GET /api/posts`: 공개 작품 목록
- `GET /api/posts/published?year=2026`: 연도별 공개 작품
- 관리자 화면, 세션, Drive 미리보기 및 변경 API는 이 프로젝트에 없습니다.
- `/api/posts`의 POST/PATCH/DELETE는 Next.js에서 405로 거부합니다.
- 관리자는 Firebase에 직접 반영하므로 앱 간 HTTP/CORS 연결이 필요하지 않습니다. 기존 조회 캐시 정책을 유지합니다.
- `src/__types/artwork.ts`는 관리자에도 복사되어 있습니다. 스키마 변경 시 양쪽 호환성을 확인하세요.

## 검증 및 배포

```sh
npm test
npm run type-check
npm run build
npm start
```

두 프로젝트는 독립적으로 설치·빌드·배포합니다. 새 프로젝트는 원래 저장소 밖에 있으므로 별도 Git 저장소/원격 연결은 직접 지정해야 합니다. 관리자 실행/인증 설정은 관리자 프로젝트 README와 ADMIN-SECURITY.md를 참고하세요.
