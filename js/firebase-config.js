/**
 * firebase-config.js
 * Firebase 설정 및 초기화
 */

// Firebase 설정 (localStorage에서 읽기 또는 기본값)
let firebaseConfig = null;

// localStorage에서 설정 불러오기
function loadFirebaseConfig() {
    const savedConfig = localStorage.getItem('firebaseConfig');

    if (savedConfig) {
        try {
            firebaseConfig = JSON.parse(savedConfig);
            console.log('✓ Firebase 설정을 localStorage에서 불러왔습니다.');
            return true;
        } catch (e) {
            console.error('Firebase 설정 파싱 실패:', e);
            return false;
        }
    }

    // localStorage에 설정이 없으면 기본값 사용 (개발용)
    firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

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
