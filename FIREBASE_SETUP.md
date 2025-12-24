# Firebase 설정 가이드

이 문서는 주간보호센터 업무수행도우미에 사용자 인증 시스템을 설정하는 방법을 안내합니다.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속합니다.
2. "프로젝트 추가" 버튼을 클릭합니다.
3. 프로젝트 이름을 입력합니다 (예: `work-assistant`).
4. Google Analytics는 선택사항입니다 (필요 없으면 비활성화).
5. "프로젝트 만들기"를 클릭하고 완료될 때까지 기다립니다.

## 2. Firebase Authentication 설정

1. Firebase Console의 왼쪽 메뉴에서 "Build" → "Authentication"을 선택합니다.
2. "시작하기" 버튼을 클릭합니다.
3. "Sign-in method" 탭을 선택합니다.
4. "이메일/비밀번호"를 클릭하여 활성화합니다.
   - "사용 설정" 토글을 켭니다.
   - "저장"을 클릭합니다.

## 3. Firestore Database 설정

1. Firebase Console의 왼쪽 메뉴에서 "Build" → "Firestore Database"를 선택합니다.
2. "데이터베이스 만들기" 버튼을 클릭합니다.
3. 보안 규칙 모드 선택:
   - **테스트 모드로 시작** (임시, 나중에 변경 예정)
4. Cloud Firestore 위치 선택:
   - `asia-northeast3 (Seoul)` 권장
5. "사용 설정"을 클릭합니다.

## 4. Firestore 보안 규칙 설정

⚠️ **중요**: 테스트 모드는 30일 후 자동으로 만료됩니다!

**자세한 보안 규칙 설정 방법은 [FIRESTORE_SECURITY_RULES.md](FIRESTORE_SECURITY_RULES.md) 파일을 참고하세요.**

간단 요약:
1. Firestore Database 페이지에서 "규칙" 탭을 선택합니다.
2. `FIRESTORE_SECURITY_RULES.md` 파일의 보안 규칙 코드를 복사하여 붙여넣습니다.
3. "게시" 버튼을 클릭합니다.

보안 규칙은 다음을 보장합니다:
- ✅ 회원가입 시 자동 승인 방지 (`approved=false` 강제)
- ✅ 권한 상승 방지 (`role=admin` 불가)
- ✅ 개인정보 보호 (본인 정보만 조회 가능)
- ✅ 관리자 권한 검증 (Firestore에서 실시간 확인)

## 5. 웹 앱 추가 및 설정 정보 가져오기

1. Firebase Console 프로젝트 홈에서 "웹 앱에 Firebase 추가" (</> 아이콘)를 클릭합니다.
2. 앱 닉네임을 입력합니다 (예: `work-assistant-web`).
3. "Firebase Hosting도 설정" 체크박스는 **체크하지 않습니다** (GitHub Pages 사용).
4. "앱 등록" 버튼을 클릭합니다.
5. Firebase SDK 설정 코드가 표시됩니다. 다음과 같은 형태입니다:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. 이 설정 정보를 복사합니다.

## 6. 프로젝트에 Firebase 설정 적용

1. `js/firebase-config.js` 파일을 엽니다.
2. `firebaseConfig` 객체의 값을 위에서 복사한 설정 정보로 교체합니다:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",           // ← 복사한 값으로 교체
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

3. 파일을 저장합니다.

## 7. 첫 번째 관리자 계정 생성

웹사이트에서 첫 회원가입을 하면 승인 대기 상태가 됩니다. 수동으로 관리자 권한을 부여해야 합니다:

### 방법 1: Firebase Console에서 직접 수정

1. Firebase Console → Firestore Database → "데이터" 탭
2. `users` 컬렉션에서 첫 번째 사용자 문서 선택
3. 다음 필드를 수정:
   - `approved`: `true`로 변경
   - `role`: `admin`으로 변경
4. 저장

### 방법 2: Firestore Rules 일시적으로 변경 (권장)

첫 계정만 자동으로 관리자가 되도록 Cloud Function을 사용하거나, 수동으로 Console에서 수정하는 것을 권장합니다.

## 8. 테스트

1. 웹사이트(`login.html`)에 접속합니다.
2. 회원가입을 진행합니다.
3. Firebase Console에서 사용자를 승인하고 관리자 권한을 부여합니다.
4. 로그인하여 정상 작동 확인합니다.
5. 관리자 대시보드(`admin.html`)에 접속하여 다른 사용자를 승인할 수 있는지 확인합니다.

## 9. 보안 주의사항

### ⚠️ 중요: API 키 보호

- `firebase-config.js`의 Firebase 설정은 **공개되어도 안전합니다**.
- Firebase는 보안 규칙으로 데이터를 보호하므로, 클라이언트 측 API 키 노출은 문제가 되지 않습니다.
- 단, GitHub에 커밋할 때 민감한 정보는 제외하려면 `.gitignore`에 추가할 수 있습니다.

### GitHub Pages 도메인 승인

Firebase Authentication에서 승인된 도메인에 GitHub Pages URL을 추가해야 합니다:

1. Firebase Console → Authentication → Settings → "승인된 도메인"
2. `your-username.github.io` 추가
3. 테스트용으로 `localhost`도 추가

## 10. 문제 해결

### "Firebase 설정이 필요합니다" 오류

- `js/firebase-config.js` 파일의 설정이 올바른지 확인
- 브라우저 개발자 도구(F12) → Console에서 오류 메시지 확인

### 로그인 후 "승인 대기 중" 메시지

- Firebase Console → Firestore Database에서 해당 사용자의 `approved` 필드를 `true`로 변경

### 관리자 대시보드 접근 불가

- Firestore Database에서 사용자의 `role` 필드가 `admin`인지 확인

## 11. 다음 단계

인증 시스템이 성공적으로 설정되면:

1. ✅ 사용자는 로그인 없이 접근할 수 없습니다.
2. ✅ 새 사용자는 관리자 승인이 필요합니다.
3. ✅ 승인된 사용자만 API 키를 설정하고 서비스를 이용할 수 있습니다.
4. ✅ 관리자는 대시보드에서 사용자를 관리할 수 있습니다.

---

## 참고 자료

- [Firebase Authentication 문서](https://firebase.google.com/docs/auth)
- [Cloud Firestore 문서](https://firebase.google.com/docs/firestore)
- [Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started)
