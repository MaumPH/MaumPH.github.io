/**
 * firebase-config.js
 * Firebase 설정 및 초기화
 */

// Firebase 설정 (Firebase Console에서 받은 설정으로 교체 필요)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

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
