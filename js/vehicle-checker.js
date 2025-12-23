/**
 * vehicle-checker.js
 * 차량 중복 검사 기능
 */

// Global state
let vehicleExcelData = null;

/**
 * 엑셀 파일 처리
 */
function handleVehicleFile(input) {
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
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // 필수 컬럼 확인
            const requiredColumns = ['일자', '입퇴소구분', '성명', '생년월일', '차량(입소)', '입소시간', '차량(퇴소)', '퇴소시간'];
            const firstRow = jsonData[0] || {};
            const missingColumns = requiredColumns.filter(col => !(col in firstRow));

            if (missingColumns.length > 0) {
                alert(`오류: 다음 필수 컬럼이 없습니다:\n${missingColumns.join(', ')}`);
                input.value = '';
                return;
            }

            vehicleExcelData = jsonData;

            // 파일 업로드 성공 표시
            document.getElementById('vc-file-status').innerHTML = `
                <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-green-800 dark:text-green-200">
                            ✓ 파일이 업로드되었습니다: <strong>${file.name}</strong> (${jsonData.length}개 행)
                        </p>
                        <button onclick="removeVehicleFile()" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium flex items-center gap-1">
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
 * 시간을 4자리 문자열로 변환 (예: 830 -> "0830")
 */
function formatTime(time) {
    if (!time && time !== 0) return '';
    const timeStr = String(Math.floor(time));
    return timeStr.padStart(4, '0');
}

/**
 * 중복 찾기 함수
 */
function findOverlaps(data, type) {
    const vehicleCol = type === '입소' ? '차량(입소)' : '차량(퇴소)';
    const timeCol = type === '입소' ? '입소시간' : '퇴소시간';

    // 유효한 데이터만 필터링
    const filteredData = data.filter(row =>
        row['입퇴소구분'] === '입퇴소' &&
        row[vehicleCol] &&
        (row[timeCol] || row[timeCol] === 0)
    );

    // 날짜, 차량, 시간별로 그룹화
    const grouped = {};

    filteredData.forEach(row => {
        const date = String(row['일자']);
        const vehicle = String(row[vehicleCol]);
        const time = formatTime(row[timeCol]);

        const key = `${date}|${vehicle}|${time}`;

        if (!grouped[key]) {
            grouped[key] = [];
        }

        grouped[key].push({
            name: row['성명'],
            birth: row['생년월일']
        });
    });

    // 중복된 항목만 추출
    const overlaps = {};

    Object.keys(grouped).forEach(key => {
        const people = grouped[key];

        if (people.length > 1) {
            const [date, vehicle, time] = key.split('|');

            if (!overlaps[date]) {
                overlaps[date] = {};
            }

            if (!overlaps[date][vehicle]) {
                overlaps[date][vehicle] = [];
            }

            overlaps[date][vehicle].push({
                time: time,
                people: people
            });
        }
    });

    return overlaps;
}

/**
 * 차량 중복 검사 실행
 */
async function checkVehicleOverlap() {
    if (!vehicleExcelData) {
        alert('먼저 엑셀 파일을 선택해주세요.');
        return;
    }

    showLoadingOverlay('처리중입니다...');

    // UI가 업데이트될 시간을 주기 위해 약간의 지연
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const admissionOverlaps = findOverlaps(vehicleExcelData, '입소');
        const dischargeOverlaps = findOverlaps(vehicleExcelData, '퇴소');

        displayVehicleResults(admissionOverlaps, dischargeOverlaps);

        hideLoadingOverlay();

    } catch (error) {
        hideLoadingOverlay();
        alert('검사 중 오류가 발생했습니다:\n' + error.message);
    }
}

/**
 * 결과 표시
 */
function displayVehicleResults(admissionOverlaps, dischargeOverlaps) {
    const report = [];
    report.push('--- 차량 시간 중복 검사 결과 ---');

    const allDates = [...new Set([
        ...Object.keys(admissionOverlaps),
        ...Object.keys(dischargeOverlaps)
    ])].sort();

    if (allDates.length === 0) {
        report.push('');
        report.push('>> 중복되는 내역이 없습니다.');
    } else {
        allDates.forEach(date => {
            report.push('');
            report.push('========================================');
            report.push(`날짜: ${date.slice(0, 4)}년 ${date.slice(4, 6)}월 ${date.slice(6)}일`);
            report.push('========================================');

            if (admissionOverlaps[date]) {
                report.push('');
                report.push('[--- 등원(입소) 차량 중복 ---]');

                Object.keys(admissionOverlaps[date]).forEach(vehicle => {
                    report.push('');
                    report.push(`▶ 차량번호: ${vehicle}`);

                    admissionOverlaps[date][vehicle].forEach(item => {
                        report.push(`  - 중복 시간: ${item.time.slice(0, 2)}:${item.time.slice(2)}`);

                        item.people.forEach(person => {
                            report.push(`    * 성명: ${person.name}, 생년월일: ${person.birth}`);
                        });
                    });
                });
            }

            if (dischargeOverlaps[date]) {
                report.push('');
                report.push('[--- 하원(퇴소) 차량 중복 ---]');

                Object.keys(dischargeOverlaps[date]).forEach(vehicle => {
                    report.push('');
                    report.push(`▶ 차량번호: ${vehicle}`);

                    dischargeOverlaps[date][vehicle].forEach(item => {
                        report.push(`  - 중복 시간: ${item.time.slice(0, 2)}:${item.time.slice(2)}`);

                        item.people.forEach(person => {
                            report.push(`    * 성명: ${person.name}, 생년월일: ${person.birth}`);
                        });
                    });
                });
            }
        });
    }

    document.getElementById('vc-result-content').textContent = report.join('\n');
    document.getElementById('vc-result-section').classList.remove('hidden');
}

/**
 * 파일 제거
 */
function removeVehicleFile() {
    vehicleExcelData = null;
    document.getElementById('vc-file-input').value = '';
    document.getElementById('vc-file-status').innerHTML = '';
    document.getElementById('vc-result-section').classList.add('hidden');
}

/**
 * 결과 복사
 */
function copyVehicleResult() {
    const content = document.getElementById('vc-result-content').textContent;

    if (!content || content.trim() === '') {
        alert('먼저 중복 검사를 실행해주세요.');
        return;
    }

    navigator.clipboard.writeText(content).then(() => {
        alert('✓ 검사 결과가 클립보드에 복사되었습니다.');
    }).catch(err => {
        alert('복사 중 오류가 발생했습니다: ' + err);
    });
}
