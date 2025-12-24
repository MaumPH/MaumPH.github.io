/**
 * elder-time-checker.js
 * 어르신 시간확인 기능
 */

// Global state
let elderTimeExcelData = null;

/**
 * 엑셀 파일 처리
 */
function handleElderTimeFile(input) {
    const file = input.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Sheet1 찾기
            if (!workbook.SheetNames.includes('Sheet1')) {
                alert('오류: 엑셀 파일에서 "Sheet1" 시트를 찾을 수 없습니다.\n시트 이름이 "Sheet1"(대소문자 구분)인지 확인해주세요.');
                input.value = '';
                return;
            }

            const worksheet = workbook.Sheets['Sheet1'];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });

            // 헤더 제거 (첫 번째 행)
            const dataRows = jsonData.slice(1);

            // 데이터 검증
            if (dataRows.length === 0) {
                alert('오류: 엑셀 파일에 데이터가 없습니다.');
                input.value = '';
                return;
            }

            elderTimeExcelData = dataRows;

            // 파일 업로드 성공 표시
            document.getElementById('etc-file-status').innerHTML = `
                <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-green-800 dark:text-green-200">
                            ✓ 파일이 업로드되었습니다: <strong>${file.name}</strong> (${dataRows.length}개 행)
                        </p>
                        <button onclick="removeElderTimeFile()" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium flex items-center gap-1">
                            <span class="material-symbols-outlined text-lg">close</span>
                            파일 제거
                        </button>
                    </div>
                </div>
            `;

        } catch (error) {
            alert('파일 처리 중 오류가 발생했습니다:\n' + error.message);
            input.value = '';
        }
    };

    reader.readAsArrayBuffer(file);
}

/**
 * 시간 문자열을 분으로 변환 (예: "0814" -> 494분)
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const str = String(timeStr).padStart(4, '0');
    const hours = parseInt(str.substring(0, 2), 10);
    const minutes = parseInt(str.substring(2, 4), 10);
    return hours * 60 + minutes;
}

/**
 * 분을 시간 문자열로 변환 (예: 430분 -> "7시간 10분")
 */
function minutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
}

/**
 * 시간 차이 계산
 */
function calculateTimeDifference(startTime, endTime) {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (end < start) {
        // 다음날로 넘어가는 경우
        return (24 * 60 - start) + end;
    }

    return end - start;
}

/**
 * 날짜 포맷 (20251201 -> 2025년 12월 01일)
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const str = String(dateStr);
    return `${str.substring(0, 4)}년 ${str.substring(4, 6)}월 ${str.substring(6, 8)}일`;
}

/**
 * 시간 포맷 (0814 -> 08:14)
 */
function formatTime(timeStr) {
    if (!timeStr) return '';
    const str = String(timeStr).padStart(4, '0');
    return `${str.substring(0, 2)}:${str.substring(2, 4)}`;
}

/**
 * 어르신 시간 분석
 */
async function analyzeElderTime() {
    if (!elderTimeExcelData) {
        alert('먼저 엑셀 파일을 선택해주세요.');
        return;
    }

    showLoadingOverlay('처리중입니다...');

    // UI가 업데이트될 시간을 주기 위해 약간의 지연
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const results = {
            lessThan3: [],      // 3시간 미만
            between3And6: [],   // 3시간 이상 6시간 미만
            between6And8: []    // 6시간 이상 8시간 미만
        };

        elderTimeExcelData.forEach(row => {
            const name = row.A;           // 성명
            const birth = row.B;          // 생년월일
            const date = row.C;           // 일자
            const status = row.E;         // 입퇴소구분
            const startTime = row.G;      // 입소시간
            const endTime = row.H;        // 퇴소시간

            // 입퇴소인 경우만 처리
            if (status !== '입퇴소') {
                return;
            }

            // 시간이 없으면 스킵
            if (!startTime || !endTime) {
                return;
            }

            // 시간 차이 계산 (분 단위)
            const diffMinutes = calculateTimeDifference(startTime, endTime);
            const diffHours = diffMinutes / 60;

            // 8시간 이상이면 제외
            if (diffHours >= 8) {
                return;
            }

            const record = {
                name: name || '',
                birth: birth || '',
                date: date || '',
                startTime: startTime || '',
                endTime: endTime || '',
                diffMinutes: diffMinutes,
                diffHours: diffHours
            };

            // 시간대별 분류
            if (diffHours < 3) {
                results.lessThan3.push(record);
            } else if (diffHours < 6) {
                results.between3And6.push(record);
            } else {
                results.between6And8.push(record);
            }
        });

        // 시간이 많은 순서로 정렬
        results.lessThan3.sort((a, b) => b.diffMinutes - a.diffMinutes);
        results.between3And6.sort((a, b) => b.diffMinutes - a.diffMinutes);
        results.between6And8.sort((a, b) => b.diffMinutes - a.diffMinutes);

        displayElderTimeResults(results);

        hideLoadingOverlay();

    } catch (error) {
        hideLoadingOverlay();
        alert('분석 중 오류가 발생했습니다:\n' + error.message);
    }
}

/**
 * 날짜를 간략 형식으로 변환 (20251201 -> 12/01)
 */
function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const str = String(dateStr);
    return `${str.substring(4, 6)}/${str.substring(6, 8)}`;
}

/**
 * 표 행 생성
 */
function createTableRow(index, record) {
    return `
        <tr class="border-t border-gray-200 dark:border-gray-600">
            <td class="px-2 py-2">${index}</td>
            <td class="px-2 py-2">${record.name}</td>
            <td class="px-2 py-2">${formatDateShort(record.date)}</td>
            <td class="px-2 py-2 text-xs">${formatTime(record.startTime)}~${formatTime(record.endTime)}<br><span class="text-gray-500">(${minutesToTimeString(record.diffMinutes)})</span></td>
        </tr>
    `;
}

/**
 * 결과 표시
 */
function displayElderTimeResults(results) {
    // 3시간 미만
    const less3Body = document.getElementById('etc-result-less3');
    if (results.lessThan3.length === 0) {
        less3Body.innerHTML = '<tr><td colspan="4" class="px-2 py-4 text-center text-gray-500">데이터 없음</td></tr>';
    } else {
        less3Body.innerHTML = results.lessThan3.map((record, idx) => createTableRow(idx + 1, record)).join('');
    }

    // 3시간 이상 6시간 미만
    const between3to6Body = document.getElementById('etc-result-3to6');
    if (results.between3And6.length === 0) {
        between3to6Body.innerHTML = '<tr><td colspan="4" class="px-2 py-4 text-center text-gray-500">데이터 없음</td></tr>';
    } else {
        between3to6Body.innerHTML = results.between3And6.map((record, idx) => createTableRow(idx + 1, record)).join('');
    }

    // 6시간 이상 8시간 미만
    const between6to8Body = document.getElementById('etc-result-6to8');
    if (results.between6And8.length === 0) {
        between6to8Body.innerHTML = '<tr><td colspan="4" class="px-2 py-4 text-center text-gray-500">데이터 없음</td></tr>';
    } else {
        between6to8Body.innerHTML = results.between6And8.map((record, idx) => createTableRow(idx + 1, record)).join('');
    }

    document.getElementById('etc-result-section').classList.remove('hidden');
}

/**
 * 파일 제거
 */
function removeElderTimeFile() {
    elderTimeExcelData = null;
    document.getElementById('etc-file-input').value = '';
    document.getElementById('etc-file-status').innerHTML = '';
    document.getElementById('etc-result-section').classList.add('hidden');
}
