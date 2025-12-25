/**
 * ui.js
 * UI 공통 함수 및 네비게이션 관리
 * - 페이지 전환 (showPage)
 * - 로딩 오버레이
 * - 프로그레스 바
 * - 메뉴 네비게이션
 */

// 페이지 표시 함수
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('[id^="page-"]').forEach(page => {
        page.classList.remove('page-active');
        page.classList.add('page-hidden');
    });

    // Show selected page
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.remove('page-hidden');
        targetPage.classList.add('page-active');
    }

    currentPage = pageName;

    // Update menu highlights
    // Reset all menu items
    document.querySelectorAll('.submenu-link').forEach(link => {
        link.classList.remove('text-primary', 'font-semibold', 'bg-primary/5', 'dark:bg-primary/10');
        link.classList.add('text-gray-600', 'dark:text-gray-400');
        const dot = link.querySelector('.submenu-dot');
        if (dot) {
            dot.classList.remove('bg-primary');
            dot.classList.add('bg-gray-300', 'dark:bg-gray-600');
        }
    });

    // Reset all top-level menu items
    const menuItems = ['nav-case-management', 'nav-counseling-log', 'nav-grievance', 'nav-newsletter', 'nav-settings'];
    menuItems.forEach(id => {
        const nav = document.getElementById(id);
        if (nav) {
            nav.classList.remove('bg-primary/10', 'dark:bg-primary/20');
            const icon = nav.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = '';
            const text = nav.querySelector('p');
            if (text) {
                text.classList.remove('text-primary', 'font-bold');
                text.classList.add('text-gray-500', 'dark:text-gray-400');
            }
        }
    });

    // Reset journal menu toggle button
    const journalBtn = document.getElementById('journal-menu-toggle');
    if (journalBtn) {
        journalBtn.classList.remove('bg-primary/10', 'dark:bg-primary/20');
    }

    // Reset billing menu toggle button
    const billingBtn = document.getElementById('billing-menu-toggle');
    if (billingBtn) {
        billingBtn.classList.remove('bg-primary/10', 'dark:bg-primary/20');
    }

    // Reset program menu toggle button
    const programBtn = document.getElementById('program-menu-toggle');
    if (programBtn) {
        programBtn.classList.remove('bg-primary/10', 'dark:bg-primary/20');
    }

    // Highlight active menu item
    if (pageName === 'step1' || pageName === 'step2' || pageName === 'step3') {
        // Highlight submenu item
        const activeNav = document.getElementById(`nav-${pageName}`);
        if (activeNav) {
            activeNav.classList.remove('text-gray-600', 'dark:text-gray-400');
            activeNav.classList.add('text-primary', 'font-semibold', 'bg-primary/5', 'dark:bg-primary/10');
            const dot = activeNav.querySelector('.submenu-dot');
            if (dot) {
                dot.classList.remove('bg-gray-300', 'dark:bg-gray-600');
                dot.classList.add('bg-primary');
            }
        }

        // Highlight journal menu button
        const journalBtn = document.getElementById('journal-menu-toggle');
        if (journalBtn) {
            journalBtn.classList.add('bg-primary/10', 'dark:bg-primary/20');
        }
    } else if (pageName === 'vehicle-checker' || pageName === 'elder-time-checker') {
        // Highlight submenu item
        const activeNav = document.getElementById(`nav-${pageName}`);
        if (activeNav) {
            activeNav.classList.remove('text-gray-600', 'dark:text-gray-400');
            activeNav.classList.add('text-primary', 'font-semibold', 'bg-primary/5', 'dark:bg-primary/10');
            const dot = activeNav.querySelector('.submenu-dot');
            if (dot) {
                dot.classList.remove('bg-gray-300', 'dark:bg-gray-600');
                dot.classList.add('bg-primary');
            }
        }

        // Highlight billing menu button
        const billingBtn = document.getElementById('billing-menu-toggle');
        if (billingBtn) {
            billingBtn.classList.add('bg-primary/10', 'dark:bg-primary/20');
        }
    } else if (pageName === 'program-log' || pageName === 'program-editor' || pageName === 'program-feedback') {
        // Highlight submenu item
        const activeNav = document.getElementById(`nav-${pageName}`);
        if (activeNav) {
            activeNav.classList.remove('text-gray-600', 'dark:text-gray-400');
            activeNav.classList.add('text-primary', 'font-semibold', 'bg-primary/5', 'dark:bg-primary/10');
            const dot = activeNav.querySelector('.submenu-dot');
            if (dot) {
                dot.classList.remove('bg-gray-300', 'dark:bg-gray-600');
                dot.classList.add('bg-primary');
            }
        }

        // Highlight program menu button
        const programBtn = document.getElementById('program-menu-toggle');
        if (programBtn) {
            programBtn.classList.add('bg-primary/10', 'dark:bg-primary/20');
        }
    } else if (pageName === 'case-management') {
        const navCaseManagement = document.getElementById('nav-case-management');
        if (navCaseManagement) {
            navCaseManagement.classList.add('bg-primary/10', 'dark:bg-primary/20');
            const icon = navCaseManagement.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
            const text = navCaseManagement.querySelector('p');
            if (text) {
                text.classList.remove('text-gray-500', 'dark:text-gray-400');
                text.classList.add('text-primary', 'font-bold');
            }
        }
    } else if (pageName === 'counseling-log') {
        const navCounselingLog = document.getElementById('nav-counseling-log');
        if (navCounselingLog) {
            navCounselingLog.classList.add('bg-primary/10', 'dark:bg-primary/20');
            const icon = navCounselingLog.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
            const text = navCounselingLog.querySelector('p');
            if (text) {
                text.classList.remove('text-gray-500', 'dark:text-gray-400');
                text.classList.add('text-primary', 'font-bold');
            }
        }
    } else if (pageName === 'newsletter') {
        const navNewsletter = document.getElementById('nav-newsletter');
        if (navNewsletter) {
            navNewsletter.classList.add('bg-primary/10', 'dark:bg-primary/20');
            const icon = navNewsletter.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
            const text = navNewsletter.querySelector('p');
            if (text) {
                text.classList.remove('text-gray-500', 'dark:text-gray-400');
                text.classList.add('text-primary', 'font-bold');
            }
        }
    } else if (pageName === 'settings') {
        const navSettings = document.getElementById('nav-settings');
        if (navSettings) {
            navSettings.classList.add('bg-primary/10', 'dark:bg-primary/20');
            const icon = navSettings.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
            const text = navSettings.querySelector('p');
            if (text) {
                text.classList.remove('text-gray-500', 'dark:text-gray-400');
                text.classList.add('text-primary', 'font-bold');
            }
        }
    }

    // Update progress bar visibility
    const progressSection = document.getElementById('progress-section');
    if (pageName === 'step1' || pageName === 'step2' || pageName === 'step3') {
        progressSection.style.display = 'flex';

        // Update step
        if (pageName === 'step1') currentStep = 1;
        else if (pageName === 'step2') currentStep = 2;
        else if (pageName === 'step3') currentStep = 3;

        updateProgress();
    } else {
        progressSection.style.display = 'none';
    }

    // 프로그램 일지 페이지로 이동 시 자동완성 설정
    if (pageName === 'program-log' && typeof setupProgramAutocomplete === 'function') {
        // 약간의 딜레이 후 설정 (DOM이 완전히 렌더링된 후)
        setTimeout(() => {
            setupProgramAutocomplete();
        }, 100);
    }

    window.scrollTo(0, 0);
}

// 프로그레스 바 업데이트
function updateProgress() {
    document.getElementById('step-indicator').textContent = `STEP ${currentStep} OF 3`;
    const progress = currentStep === 1 ? 0 : currentStep === 2 ? 50 : 90;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${progress}% 완료`;
}

// 저널 메뉴 토글
function toggleJournalMenu() {
    const submenu = document.getElementById('journal-submenu');
    const icon = document.getElementById('journal-menu-icon');

    if (submenu.style.display === 'none') {
        submenu.style.display = 'flex';
        icon.textContent = 'expand_less';
    } else {
        submenu.style.display = 'none';
        icon.textContent = 'expand_more';
    }
}

// 청구 준비 메뉴 토글
function toggleBillingMenu() {
    const submenu = document.getElementById('billing-submenu');
    const icon = document.getElementById('billing-menu-icon');

    if (submenu.style.display === 'none') {
        submenu.style.display = 'flex';
        icon.textContent = 'expand_less';
    } else {
        submenu.style.display = 'none';
        icon.textContent = 'expand_more';
    }
}

// 프로그램 메뉴 토글
function toggleProgramMenu() {
    const submenu = document.getElementById('program-submenu');
    const icon = document.getElementById('program-menu-icon');

    if (submenu.style.display === 'none') {
        submenu.style.display = 'flex';
        icon.textContent = 'expand_less';
    } else {
        submenu.style.display = 'none';
        icon.textContent = 'expand_more';
    }
}

// 로딩 오버레이 표시
function showLoadingOverlay(message = '처리 중입니다...') {
    const overlay = document.getElementById('loading-overlay');
    const messageEl = document.getElementById('loading-message');
    messageEl.textContent = message;
    overlay.classList.add('active');
}

// 로딩 오버레이 숨김
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
}

// PDF 업로드 처리
async function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('pdf-filename').textContent = file.name;
    document.getElementById('pdf-preview').classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = async function(e) {
        const typedarray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            text += pageText + '\n';
        }

        pdfText = text;
    };
    reader.readAsArrayBuffer(file);
}

// Drag and drop 설정
function setupDragAndDrop() {
    const dropArea = document.getElementById('pdf-upload-area');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('drag-over');
        }, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                document.getElementById('pdf-file-input').files = files;
                handlePDFUpload({ target: { files: files } });
            } else {
                alert('PDF 파일만 업로드 가능합니다.');
            }
        }
    }
}
