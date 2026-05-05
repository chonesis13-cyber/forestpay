/**
 * Forest Pay (포레스트 페이) - 재상님 맞춤형 급여 계산기
 * 포함 기능: 주휴수당, 12.6% 공제, 유급휴일(5/1, 5/5) 반영, 초기화
 */

// 1. 초기 데이터 로드 (로컬 스토리지)
let currentWage = localStorage.getItem('forest-pay-wage') || 0;
let workDays = JSON.parse(localStorage.getItem('forest-pay-days')) || []; 

// 2026년 공휴일 및 유급휴일 설정
const holidays2026 = ["2026-01-01", "2026-03-01", "2026-05-05", "2026-05-24", "2026-06-06", "2026-08-15", "2026-10-03", "2026-10-09", "2026-12-25"];
const paidHolidays = ["2026-05-01", "2026-05-05"]; // 일을 안 해도 일당이 나오는 날

// HTML 요소 연결
const wageInput = document.getElementById('daily-wage');
const totalDisplay = document.getElementById('total-salary');
const actualDisplay = document.getElementById('actual-salary');
const grid = document.getElementById('calendar-grid');
const resetBtn = document.getElementById('reset-btn');

// 초기 실행
wageInput.value = currentWage;
renderCalendar();
calculateTotal();

// --- 이벤트 핸들러 ---

// 일당 입력 시 저장
wageInput.addEventListener('input', (e) => {
    currentWage = e.target.value;
    localStorage.setItem('forest-pay-wage', currentWage);
    calculateTotal();
});

// 초기화 버튼 클릭
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm("모든 근무 기록과 설정된 일당이 삭제됩니다. 초기화할까요?")) {
            localStorage.clear();
            currentWage = 0;
            workDays = [];
            wageInput.value = '';
            renderCalendar();
            calculateTotal();
            alert("기록이 맑게 정리되었습니다. 🌲");
        }
    });
}

// --- 핵심 함수 ---

// 달력 렌더링 (2026년 5월 기준 밀림 방지 포함)
function renderCalendar() {
    grid.innerHTML = '';
    const now = new Date(); 
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay(); // 1일 요일 (0:일 ~ 6:토)
    const lastDay = new Date(year, month + 1, 0).getDate();

    // 시작 요일 빈칸 채우기
    for (let x = 0; x < firstDayIndex; x++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day-empty');
        grid.appendChild(emptyDiv);
    }

    // 날짜 그리기
    for (let i = 1; i <= lastDay; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dateObj = new Date(year, month, i);
        const dayOfWeek = dateObj.getDay();
        
        const dayEl = document.createElement('div');
        dayEl.classList.add('day');
        dayEl.innerText = i;
        
        // 주말 및 공휴일 스타일링
        const isHoliday = dayOfWeek === 0 || dayOfWeek === 6 || holidays2026.includes(dateStr);
        if (dayOfWeek === 0) dayEl.classList.add('sun');
        if (dayOfWeek === 6) dayEl.classList.add('sat');
        if (isHoliday) dayEl.classList.add('is-holiday');
        
        // 클릭된 날 표시
        if (workDays.includes(dateStr)) dayEl.classList.add('active');

        dayEl.onclick = () => toggleDay(dateStr, dayEl);
        grid.appendChild(dayEl);
    }
}

// 날짜 클릭 토글
function toggleDay(dateStr, el) {
    if (workDays.includes(dateStr)) {
        workDays = workDays.filter(d => d !== dateStr);
        el.classList.remove('active');
    } else {
        workDays.push(dateStr);
        el.classList.add('active');
    }
    localStorage.setItem('forest-pay-days', JSON.stringify(workDays));
    calculateTotal();
}

// 급여 정산 로직 (주휴수당 + 12.6% 공제 + 유급휴일)
function calculateTotal() {
    let total = 0;
    let weeklyCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    // 특정 공휴일(5/1, 5/5) 리스트
    const specialHolidays = ["2026-05-01", "2026-05-05"]; 

    workDays.forEach(dateStr => {
        const d = new Date(dateStr);
        const isSunOrSat = d.getDay() === 0 || d.getDay() === 6;
        const isPublicHoliday = holidays2026.includes(dateStr);
        
        // [로직 수정] 5월 1일과 5일은 클릭 시 '일당 1배'만 적용
        if (specialHolidays.includes(dateStr)) {
            total += currentWage * 1.0; 
        } 
        // 그 외 주말이나 일반 공휴일은 기존처럼 1.5배 적용
        else if (isSunOrSat || isPublicHoliday) {
            total += currentWage * 1.5;
        } 
        // 평일은 1배 적용
        else {
            total += currentWage * 1.0;
        }

        // 주차별 근무일 카운트 (주휴수당용)
        const weekNum = getWeekNumber(d);
        weeklyCount[weekNum] = (weeklyCount[weekNum] || 0) + 1;
    });

    // 주휴수당 계산 (주 5일 이상 근무 시)
    let weeklyAllowance = 0;
    Object.values(weeklyCount).forEach(count => {
        if (count >= 5) weeklyAllowance += Number(currentWage);
    });

    const preTaxTotal = total + weeklyAllowance;

    // 재상님 맞춤 12.6% 공제율 적용
    const taxRate = 0.126;
    const actualPay = preTaxTotal * (1 - taxRate);

    // UI 업데이트
    totalDisplay.innerText = `₩ ${Math.floor(preTaxTotal).toLocaleString()}`;
    if (actualDisplay) {
        actualDisplay.innerText = `₩ ${Math.floor(actualPay).toLocaleString()}`;
    }
    
    const summaryEl = document.querySelector('.summary-info');
    if (summaryEl) {
        summaryEl.innerText = weeklyAllowance > 0 ? "주휴수당 포함 (세전)" : "이번 달 예상 세전 총액";
    }
}
}
// 주차 계산 보조 함수
function getWeekNumber(d) {
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    return Math.ceil((d.getDate() + firstDay) / 7);
}
