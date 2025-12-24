/**
 * firebase-config.js
 * Firebase 설정 및 초기화
 */

// Firebase 설정 (코드에 직접 입력하세요)
// 아래 값을 Firebase Console에서 받은 실제 값으로 변경하면 모든 PC/브라우저에서 자동으로 작동합니다.
// firebase-setup.html 페이지에서 "코드 생성" 기능을 사용하면 쉽게 복사할 수 있습니다.
const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDyQSHAkkdgBhw9QVw1NENWA9g4DXZkWuY",
    authDomain: "work-assistant-4e162.firebaseapp.com",
    projectId: "work-assistant-4e162",
    storageBucket: "work-assistant-4e162.firebasestorage.app",
    messagingSenderId: "692148378218",
    appId: "1:692148378218:web:691cdcc3d92f2c7cef4813"
};

let firebaseConfig = null;

// Firebase 설정 불러오기
function loadFirebaseConfig() {
    // 1. 코드에 하드코딩된 설정 확인 (권장 방식)
    if (DEFAULT_FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY") {
        firebaseConfig = DEFAULT_FIREBASE_CONFIG;
        console.log('✓ Firebase 설정을 코드에서 불러왔습니다.');
        return true;
    }

    // 2. localStorage에서 설정 확인 (임시 방식)
    const savedConfig = localStorage.getItem('firebaseConfig');
    if (savedConfig) {
        try {
            firebaseConfig = JSON.parse(savedConfig);
            console.log('✓ Firebase 설정을 localStorage에서 불러왔습니다.');
            console.warn('💡 Tip: firebase-config.js에 설정을 직접 넣으면 모든 PC에서 자동으로 작동합니다.');
            return true;
        } catch (e) {
            console.error('Firebase 설정 파싱 실패:', e);
        }
    }

    // 3. 설정이 없음
    firebaseConfig = DEFAULT_FIREBASE_CONFIG;
    console.warn('⚠️ Firebase 설정이 없습니다. firebase-setup.html에서 설정을 완료하세요.');
    return false;
}

// Firebase 초기화 여부 확인
let firebaseApp = null;
let auth = null;
let db = null;

// Firebase 초기화
function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK가 로드되지 않았습니다.');
        return false;
    }

    // localStorage에서 설정 불러오기
    loadFirebaseConfig();

    // 설정이 유효한지 확인
    if (!firebaseConfig || firebaseConfig.apiKey === "YOUR_API_KEY") {
        console.error('⚠️ Firebase 설정이 필요합니다.');

        // firebase-setup.html로 리디렉트할지 확인
        if (window.location.pathname.indexOf('firebase-setup.html') === -1 &&
            window.location.pathname.indexOf('login.html') === -1 &&
            window.location.pathname.indexOf('admin.html') === -1 &&
            window.location.pathname.indexOf('index.html') === -1) {
            return false;
        }

        // 설정 페이지가 아닌 경우 안내 메시지
        if (window.location.pathname.indexOf('firebase-setup.html') === -1) {
            const goToSetup = confirm('Firebase 설정이 필요합니다.\n설정 페이지로 이동하시겠습니까?');
            if (goToSetup) {
                window.location.href = 'firebase-setup.html';
            }
        }
        return false;
    }

    try {
        // Firebase 앱 초기화
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
            firebaseApp = firebase.app();
        }

        // Firebase 서비스 초기화
        auth = firebase.auth();
        db = firebase.firestore();

        console.log('✓ Firebase 초기화 완료');
        return true;
    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        alert('Firebase 초기화에 실패했습니다.\n설정을 확인하고 다시 시도해주세요.\n\n오류: ' + error.message);
        return false;
    }
}

// 현재 로그인한 사용자 가져오기
function getCurrentUser() {
    return auth ? auth.currentUser : null;
}

// 사용자 인증 상태 변경 감지
function onAuthStateChanged(callback) {
    if (auth) {
        return auth.onAuthStateChanged(callback);
    }
}
