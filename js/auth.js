/**
 * auth.js
 * 사용자 인증 및 권한 관리
 */

// 회원가입
async function signUp(email, password, displayName) {
    try {
        // Firebase Authentication으로 사용자 생성
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // 사용자 프로필 업데이트
        await user.updateProfile({
            displayName: displayName
        });

        // Firestore에 사용자 정보 저장 (승인 대기 상태)
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            displayName: displayName,
            approved: false,  // 관리자 승인 필요
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'user'
        });

        console.log('✓ 회원가입 완료:', email);
        return { success: true, user: user };
    } catch (error) {
        console.error('회원가입 실패:', error);
        return { success: false, error: error.message };
    }
}

// 로그인
async function signIn(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Firestore에서 사용자 승인 상태 확인
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists) {
            // 사용자 문서가 없으면 생성
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: email,
                displayName: user.displayName || email.split('@')[0],
                approved: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'user'
            });

            return {
                success: true,
                user: user,
                approved: false,
                message: '관리자 승인을 기다리고 있습니다.'
            };
        }

        const userData = userDoc.data();

        if (!userData.approved) {
            return {
                success: true,
                user: user,
                approved: false,
                message: '관리자 승인을 기다리고 있습니다.'
            };
        }

        console.log('✓ 로그인 완료:', email);
        return { success: true, user: user, approved: true, userData: userData };
    } catch (error) {
        console.error('로그인 실패:', error);
        let errorMessage = '로그인에 실패했습니다.';

        if (error.code === 'auth/user-not-found') {
            errorMessage = '존재하지 않는 계정입니다.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = '비밀번호가 올바르지 않습니다.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = '이메일 형식이 올바르지 않습니다.';
        }

        return { success: false, error: errorMessage };
    }
}

// 로그아웃
async function signOut() {
    try {
        await auth.signOut();
        console.log('✓ 로그아웃 완료');
        return { success: true };
    } catch (error) {
        console.error('로그아웃 실패:', error);
        return { success: false, error: error.message };
    }
}

// 사용자 승인 상태 확인
async function checkUserApproval(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return { approved: false };
        }

        const userData = userDoc.data();
        return {
            approved: userData.approved || false,
            role: userData.role || 'user',
            userData: userData
        };
    } catch (error) {
        console.error('승인 상태 확인 실패:', error);
        return { approved: false, error: error.message };
    }
}

// 관리자 권한 확인
async function isAdmin(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return false;
        }

        const userData = userDoc.data();
        return userData.role === 'admin';
    } catch (error) {
        console.error('관리자 권한 확인 실패:', error);
        return false;
    }
}

// 사용자 승인 (관리자 전용)
async function approveUser(userId) {
    try {
        await db.collection('users').doc(userId).update({
            approved: true,
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✓ 사용자 승인 완료:', userId);
        return { success: true };
    } catch (error) {
        console.error('사용자 승인 실패:', error);
        return { success: false, error: error.message };
    }
}

// 사용자 승인 거부 (관리자 전용)
async function rejectUser(userId) {
    try {
        await db.collection('users').doc(userId).update({
            approved: false,
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✓ 사용자 승인 거부:', userId);
        return { success: true };
    } catch (error) {
        console.error('사용자 승인 거부 실패:', error);
        return { success: false, error: error.message };
    }
}

// 대기 중인 사용자 목록 가져오기 (관리자 전용)
async function getPendingUsers() {
    try {
        const snapshot = await db.collection('users')
            .where('approved', '==', false)
            .orderBy('createdAt', 'desc')
            .get();

        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, users: users };
    } catch (error) {
        console.error('대기 중인 사용자 목록 조회 실패:', error);
        return { success: false, error: error.message, users: [] };
    }
}

// 모든 사용자 목록 가져오기 (관리자 전용)
async function getAllUsers() {
    try {
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();

        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, users: users };
    } catch (error) {
        console.error('사용자 목록 조회 실패:', error);
        return { success: false, error: error.message, users: [] };
    }
}
