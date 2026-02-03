/**
 * schedule-verification.js
 * 일정 확인 기능 - 공단 일정과 입퇴소 내용 비교
 *
 * [매핑 흐름]
 * 1. 수급자 목록 (마스터): 이름+생년월일 → 인정번호 매핑 테이블 생성
 * 2. 일정계획 (공단): 인정번호가 직접 있음 → KEY = 인정번호|일자
 * 3. 입퇴소내용: 인정번호 없음 → 이름+생년키로 수급자목록에서 인정번호 찾기 → KEY = 인정번호|일자
 */

// Global state
let svMasterData = null;      // 수급자 목록
let svScheduleData = null;    // 일정계획 (공단)
let svAttendanceData = null;  // 입퇴소내용

/**
 * 이름 정규화: 모든 공백 제거 + trim
 */
function normalizeName(name) {
    if (!name) return '';
    return String(name).replace(/\s+/g, '').trim();
}

/**
 * 날짜 정규화: yyyy-mm-dd 또는 다양한 형식 -> yyyymmdd
 */
function normalizeDate(dateVal) {
    if (!dateVal) return '';
    let str = String(dateVal).trim();

    // 숫자만 추출
    const digitsOnly = str.replace(/[^0-9]/g, '');

    // 이미 8자리면 그대로 반환
    if (digitsOnly.length === 8) {
        return digitsOnly;
    }

    // yyyy-mm-dd 또는 yyyy.mm.dd 형식
    const match = str.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
    if (match) {
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        return year + month + day;
    }

    return digitsOnly;
}

/**
 * 생년월일을 yymmdd로 변환
 * yyyy.mm.dd, yyyy-mm-dd, yyyymmdd 등 -> yymmdd
 */
function normalizeBirthKey(birthVal) {
    if (!birthVal) return '';
    let str = String(birthVal).trim();

    // 숫자만 추출
    const digitsOnly = str.replace(/[^0-9]/g, '');

    // 이미 6자리면 그대로 반환
    if (digitsOnly.length === 6) {
        return digitsOnly;
    }

    // 8자리 (yyyymmdd)면 앞 2자리 제외 (yymmdd)
    if (digitsOnly.length === 8) {
        return digitsOnly.substring(2, 8);
    }

    // yyyy.mm.dd 또는 yyyy-mm-dd 형식
    const match = str.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
    if (match) {
        const year = match[1].substring(2, 4);
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        return year + month + day;
    }

    return digitsOnly;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
function formatDateForDisplay(yyyymmdd) {
    if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
    return `${yyyymmdd.substring(0, 4)}-${yyyymmdd.substring(4, 6)}-${yyyymmdd.substring(6, 8)}`;
}

/**
 * 입퇴소구분 정규화: 출석 여부 판단
 */
function isPresent(status) {
    if (!status) return false;
    const s = String(status).trim();
    return s === '입퇴소' || s === '출석';
}

/**
 * 엑셀 파일 처리
 */
function handleScheduleFile(input, type) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // 첫 번째 시트 사용
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A', defval: '' });

            let statusElementId;

            switch (type) {
                case 'master':
                    statusElementId = 'sv-master-status';
                    svMasterData = jsonData;
                    break;
                case 'schedule':
                    statusElementId = 'sv-schedule-status';
                    svScheduleData = jsonData;
                    break;
                case 'attendance':
                    statusElementId = 'sv-attendance-status';
                    svAttendanceData = jsonData;
                    break;
            }

            document.getElementById(statusElementId).innerHTML = `
                <div class="text-green-600 dark:text-green-400 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">check_circle</span>
                    ${file.name} (${jsonData.length}행)
                </div>
            `;

        } catch (error) {
            alert(`파일 처리 중 오류가 발생했습니다:\n${error.message}`);
            input.value = '';
        }
    };

    reader.readAsArrayBuffer(file);
}

/**
 * 수급자 목록에서 헤더 행 찾기 및 매핑 생성
 *
 * [입력] 수급자 목록: 수급자명, 생년월일, 인정번호
 * [출력] person_key (이름정규화|생년키yymmdd) -> Set<인정번호>
 */
function buildMasterMap(masterData) {
    const personToId = new Map();  // person_key -> Set of 인정번호

    // 헤더 행 찾기: "수급자명", "생년월일", "인정번호" 컬럼이 있는 행
    let headerRowIdx = -1;
    let nameColIdx = -1;
    let birthColIdx = -1;
    let idColIdx = -1;

    const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

    for (let i = 0; i < Math.min(masterData.length, 20); i++) {
        const row = masterData[i];
        // 각 행에서 컬럼 초기화
        let foundName = -1, foundBirth = -1, foundId = -1;

        for (let j = 0; j < colLetters.length; j++) {
            const cellVal = String(row[colLetters[j]] || '').replace(/\s+/g, '').trim();
            if (cellVal.includes('수급자명') || cellVal === '성명' || cellVal === '이름') {
                foundName = j;
            }
            if (cellVal.includes('생년월일')) {
                foundBirth = j;
            }
            if (cellVal.includes('인정번호')) {
                foundId = j;
            }
        }

        if (foundName >= 0 && foundBirth >= 0 && foundId >= 0) {
            headerRowIdx = i;
            nameColIdx = foundName;
            birthColIdx = foundBirth;
            idColIdx = foundId;
            break;
        }
    }

    if (headerRowIdx === -1) {
        throw new Error('수급자 목록에서 헤더 행(수급자명, 생년월일, 인정번호)을 찾을 수 없습니다.');
    }

    // 데이터 행 처리 (헤더 다음 행부터)
    for (let i = headerRowIdx + 1; i < masterData.length; i++) {
        const row = masterData[i];
        const name = normalizeName(row[colLetters[nameColIdx]]);
        const birthRaw = row[colLetters[birthColIdx]];
        const birthKey = normalizeBirthKey(birthRaw);
        const recognitionId = String(row[colLetters[idColIdx]] || '').trim();

        if (!name || !birthKey || !recognitionId) continue;

        const personKey = `${name}|${birthKey}`;

        if (!personToId.has(personKey)) {
            personToId.set(personKey, new Set());
        }
        personToId.get(personKey).add(recognitionId);
    }

    return personToId;
}

/**
 * 공단 일정에서 인정번호 컬럼 및 헤더 행 찾기
 *
 * [입력] 일정계획: A열(일자), D열(이름), 수급자 인정번호 컬럼
 * [출력] { headerRowIdx, idColIdx }
 */
function findScheduleHeader(scheduleData) {
    if (!scheduleData || scheduleData.length === 0) {
        return { headerRowIdx: -1, idColIdx: -1 };
    }

    const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

    // 첫 몇 행에서 "수급자 인정번호" 또는 "인정번호" 헤더 찾기
    for (let i = 0; i < Math.min(scheduleData.length, 10); i++) {
        const row = scheduleData[i];
        for (let j = 0; j < colLetters.length; j++) {
            const cellVal = String(row[colLetters[j]] || '').replace(/\s+/g, '').trim();
            if (cellVal.includes('인정번호')) {
                return { headerRowIdx: i, idColIdx: j };
            }
        }
    }

    return { headerRowIdx: -1, idColIdx: -1 };
}

/**
 * 일정 비교 실행
 */
async function runScheduleVerification() {
    // 파일 체크
    if (!svMasterData || !svScheduleData || !svAttendanceData) {
        alert('3개의 파일을 모두 업로드해주세요.');
        return;
    }

    showLoadingOverlay('일정 비교 중...');
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

        // ============================================
        // 1. 수급자 목록에서 매핑 테이블 생성
        //    person_key (이름|생년키) -> 인정번호
        // ============================================
        const personToIdMap = buildMasterMap(svMasterData);

        // ============================================
        // 2. 입퇴소내용 처리
        //    이름+생년키로 수급자목록에서 인정번호 찾기
        //    → KEY = 인정번호|일자
        // ============================================
        const attendanceRecords = [];
        const mappingErrors = {
            notFound: [],  // {date, name, birthKey}
            ambiguous: []  // {name, birthKey, candidates: []}
        };

        // 헤더 행 건너뛰기 (첫 번째 행)
        for (let i = 1; i < svAttendanceData.length; i++) {
            const row = svAttendanceData[i];
            const name = normalizeName(row.A);           // A열: 이름
            const birthKey = String(row.B || '').trim(); // B열: 생년키 yymmdd (그대로 사용)
            const dateRaw = String(row.C || '').trim();  // C열: 일자 yyyymmdd
            const status = String(row.E || '').trim();   // E열: 입퇴소구분

            if (!name || !dateRaw) continue;

            const dateNorm = normalizeDate(dateRaw);
            const personKey = `${name}|${birthKey}`;

            // 수급자 목록에서 인정번호 매핑
            if (!personToIdMap.has(personKey)) {
                mappingErrors.notFound.push({ date: dateNorm, name, birthKey });
                continue;
            }

            const idSet = personToIdMap.get(personKey);
            if (idSet.size > 1) {
                mappingErrors.ambiguous.push({ name, birthKey, candidates: Array.from(idSet) });
                continue;
            }

            const recognitionId = Array.from(idSet)[0];
            const present = isPresent(status);

            attendanceRecords.push({
                recognitionId,
                date: dateNorm,
                name,
                birthKey,
                present
            });
        }

        // ============================================
        // 3. 일정계획(공단) 처리
        //    인정번호가 직접 있음 → KEY = 인정번호|일자
        //    (공단 파일의 생년 컬럼은 사용하지 않음)
        // ============================================
        const scheduleRecords = [];
        const { headerRowIdx, idColIdx } = findScheduleHeader(svScheduleData);

        if (idColIdx === -1) {
            throw new Error('일정계획 파일에서 인정번호 컬럼을 찾을 수 없습니다.');
        }

        // 헤더 다음 행부터 데이터 처리
        for (let i = headerRowIdx + 1; i < svScheduleData.length; i++) {
            const row = svScheduleData[i];
            const dateRaw = String(row.A || '').trim();  // A열: 일자 (yyyy-mm-dd)
            const name = normalizeName(row.D);           // D열: 이름 (출력용)
            const recognitionId = String(row[colLetters[idColIdx]] || '').trim();  // 인정번호 컬럼

            if (!dateRaw || !recognitionId) continue;

            const dateNorm = normalizeDate(dateRaw);

            scheduleRecords.push({
                recognitionId,
                date: dateNorm,
                name
            });
        }

        // ============================================
        // 4. 집합 생성
        // ============================================

        // SCHEDULE_SET: 공단 일정 KEY 집합
        const scheduleSet = new Set();
        const scheduleMap = new Map();  // KEY -> {name, date, recognitionId}

        scheduleRecords.forEach(rec => {
            const key = `${rec.recognitionId}|${rec.date}`;
            scheduleSet.add(key);
            scheduleMap.set(key, rec);
        });

        // ATT_ANY_SET: 입퇴소에서 출석/결석 관계없이 KEY 집합
        const attAnySet = new Set();
        const attAnyMap = new Map();

        // ATT_PRESENT_SET: 입퇴소에서 출석(입퇴소/출석)인 것만
        const attPresentSet = new Set();
        const attPresentMap = new Map();

        attendanceRecords.forEach(rec => {
            const key = `${rec.recognitionId}|${rec.date}`;
            attAnySet.add(key);
            attAnyMap.set(key, rec);

            if (rec.present) {
                attPresentSet.add(key);
                attPresentMap.set(key, rec);
            }
        });

        // ============================================
        // 5. 판정
        // ============================================

        // 결석: SCHEDULE_SET - ATT_ANY_SET (공단에 있는데 입퇴소에 없음)
        const absentKeys = [];
        scheduleSet.forEach(key => {
            if (!attAnySet.has(key)) {
                absentKeys.push(key);
            }
        });

        // 일정없는데 출석: ATT_PRESENT_SET - SCHEDULE_SET (입퇴소에 출석인데 공단에 없음)
        const extraPresentKeys = [];
        attPresentSet.forEach(key => {
            if (!scheduleSet.has(key)) {
                extraPresentKeys.push(key);
            }
        });

        // ============================================
        // 6. 결과 출력 생성
        // ============================================
        let result = '';

        // 디버깅: 데이터 현황
        result += `[데이터 현황]\n`;
        result += `- 수급자 목록 매핑: ${personToIdMap.size}명\n`;
        result += `- 일정계획(공단) 레코드: ${scheduleRecords.length}건 (KEY: ${scheduleSet.size}개)\n`;
        result += `- 입퇴소내용 매핑성공: ${attendanceRecords.length}건\n`;
        result += `- 입퇴소 출석(입퇴소): ${attPresentSet.size}건\n`;
        result += `- 입퇴소 전체(출석+결석): ${attAnySet.size}건\n`;
        result += `\n`;

        // 디버깅: 샘플 데이터
        result += `[샘플 - 수급자 목록 매핑 (상위 5개)]\n`;
        let sampleCount = 0;
        for (const [key, idSet] of personToIdMap) {
            if (sampleCount >= 5) break;
            result += `  ${key} → ${Array.from(idSet).join(',')}\n`;
            sampleCount++;
        }
        result += `\n`;

        result += `[샘플 - 입퇴소내용 person_key (상위 5개)]\n`;
        for (let i = 1; i < Math.min(svAttendanceData.length, 6); i++) {
            const row = svAttendanceData[i];
            const name = normalizeName(row.A);
            const birthKey = String(row.B || '').trim();
            result += `  ${name}|${birthKey} (원본: A="${row.A}", B="${row.B}")\n`;
        }
        result += `\n`;

        result += `[샘플 - 공단 일정 KEY (상위 5개)]\n`;
        result += `  헤더행: ${headerRowIdx}, 인정번호컬럼: ${colLetters[idColIdx]}\n`;
        let schedSampleCount = 0;
        for (const key of scheduleSet) {
            if (schedSampleCount >= 5) break;
            const rec = scheduleMap.get(key);
            result += `  KEY: ${key} (이름: ${rec.name})\n`;
            schedSampleCount++;
        }
        result += `\n`;

        result += `[샘플 - 입퇴소 KEY (상위 5개)]\n`;
        let attSampleCount = 0;
        for (const key of attPresentSet) {
            if (attSampleCount >= 5) break;
            const rec = attPresentMap.get(key);
            result += `  KEY: ${key} (이름: ${rec.name})\n`;
            attSampleCount++;
        }
        result += `\n`;

        result += `결석 (공단 O / 입퇴소 X)\t${absentKeys.length}건\n`;
        result += `일정없는데 출석 (공단 X / 입퇴소 O)\t${extraPresentKeys.length}건\n`;

        // 일정없는데 출석 상세
        if (extraPresentKeys.length > 0) {
            result += `\n[일정없는데 출석 대상]\n`;
            extraPresentKeys.sort().forEach(key => {
                const rec = attPresentMap.get(key);
                if (rec) {
                    result += `- ${formatDateForDisplay(rec.date)} | ${rec.name} | 생년월일(키) ${rec.birthKey} | 인정번호 ${rec.recognitionId}\n`;
                }
            });
        }

        // 매핑오류 출력
        result += `\n[매핑오류]\n`;

        // NOT_FOUND: 수급자 목록에 없는 이름+생년키
        const uniqueNotFound = [];
        const seenNF = new Set();
        mappingErrors.notFound.forEach(nf => {
            const key = `${nf.name}|${nf.birthKey}`;
            if (!seenNF.has(key)) {
                seenNF.add(key);
                uniqueNotFound.push(nf);
            }
        });
        const notFoundCount = uniqueNotFound.length;
        result += `- NOT_FOUND: ${notFoundCount}건`;
        if (notFoundCount > 0) {
            result += `\n`;
            const top20NF = uniqueNotFound.slice(0, 20);
            top20NF.forEach(nf => {
                result += `  ${nf.date}|${nf.name}|${nf.birthKey}\n`;
            });
            if (uniqueNotFound.length > 20) result += `  ... 외 ${uniqueNotFound.length - 20}건\n`;
        } else {
            result += `\n`;
        }

        // AMBIGUOUS: 동일 이름+생년키에 인정번호가 2개 이상
        const uniqueAmbiguous = [];
        const seenAmb = new Set();
        mappingErrors.ambiguous.forEach(amb => {
            const key = `${amb.name}|${amb.birthKey}`;
            if (!seenAmb.has(key)) {
                seenAmb.add(key);
                uniqueAmbiguous.push(amb);
            }
        });
        const ambiguousCount = uniqueAmbiguous.length;
        result += `- AMBIGUOUS: ${ambiguousCount}건`;
        if (ambiguousCount > 0) {
            result += `\n`;
            const top20Amb = uniqueAmbiguous.slice(0, 20);
            top20Amb.forEach(amb => {
                result += `  ${amb.name}|${amb.birthKey}|[${amb.candidates.join(',')}]\n`;
            });
            if (uniqueAmbiguous.length > 20) result += `  ... 외 ${uniqueAmbiguous.length - 20}건\n`;
        } else {
            result += `\n`;
        }

        // 결과 표시
        document.getElementById('sv-result-content').textContent = result;
        document.getElementById('sv-result-section').classList.remove('hidden');

        hideLoadingOverlay();

    } catch (error) {
        hideLoadingOverlay();
        alert(`분석 중 오류가 발생했습니다:\n${error.message}`);
        console.error(error);
    }
}

/**
 * 결과 복사
 */
function copyScheduleResult() {
    const resultContent = document.getElementById('sv-result-content').textContent;

    navigator.clipboard.writeText(resultContent).then(() => {
        // 복사 성공 알림
        const btn = document.querySelector('[onclick="copyScheduleResult()"]');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined text-lg">check</span> 복사됨';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
    }).catch(err => {
        alert('클립보드 복사에 실패했습니다.');
    });
}

/**
 * 파일 초기화
 */
function resetScheduleVerification() {
    svMasterData = null;
    svScheduleData = null;
    svAttendanceData = null;

    document.getElementById('sv-master-input').value = '';
    document.getElementById('sv-schedule-input').value = '';
    document.getElementById('sv-attendance-input').value = '';

    document.getElementById('sv-master-status').innerHTML = '';
    document.getElementById('sv-schedule-status').innerHTML = '';
    document.getElementById('sv-attendance-status').innerHTML = '';

    document.getElementById('sv-result-section').classList.add('hidden');
}
