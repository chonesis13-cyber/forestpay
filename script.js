// 1. 초기 변수 설정 (로컬 스토리지에서 데이터 불러오기)
let currentWage = localStorage.getItem('forest-pay-wage') || 0;
let workDays = JSON.parse(localStorage.getItem('forest-pay-days')) || []; 

// 2026년 공휴일 설정 (필요시 추가)
const holidays2026 = ["2026-01-01", "2026-03-01", "2026-05-05", "2026-05-24", "2026-06-06", "2026-08-15", "2026-10-03", "2026-10-09", "2026-12-25"];

// HTML 요소 가져오기
const wageInput = document.getElementById('daily-wage');
const totalDisplay = document.getElementById('total-salary');
const actualDisplay = document.getElementById('actual-salary'); // 실수령액 표시용
const grid = document.getElementById('calendar-grid');
const resetBtn = document.getElementById('reset-btn');

// 초기 화면 셋팅
wageInput.value = currentWage;
renderCalendar();
calculateTotal();

// --- 이벤트 리스너 ---

// 일당 입력 시 저장 및 계산
wageInput.addEventListener('input', (e) => {
    currentWage = e.target.value;
    localStorage.setItem('forest-pay-wage', currentWage);
    calculateTotal();
});

// 초기화 버튼 클릭 시
resetBtn.addEventListener('click', () => {
    if (confirm("모든 근무 기록과 설정된 일당이 삭제됩니다. 초기화할까요?")) {
        localStorage.removeItem('forest-pay-wage');
        localStorage.removeItem('forest-pay-days');
        currentWage = 0;
        workDays = [];
        wageInput.value = '';
        renderCalendar();
        calculateTotal();
        alert("기록이 맑게 정리되었습니다. 🌲");
    }
});

// --- 주요 함수 ---

// 달력 그리기 함수
function renderCalendar() {
    grid.innerHTML = '';
    const now = new Date(); 
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay(); // 1일의 요일
    const lastDay = new Date(year, month + 1, 0).getDate();  // 해당 월의 마지막 날

    // 시작 요일 맞추기 (빈칸 채우기)
    for (let x = 0; x < firstDayIndex; x++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day-empty');
        grid.appendChild(emptyDiv);
    }

    // 날짜 생성
    for (let i = 1; i <= lastDay; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dateObj = new Date(year, month, i);
        const dayOfWeek = dateObj.getDay();
        
        const dayEl = document.createElement('div');
        dayEl.classList.add('day');
        dayEl.innerText = i;
        
        const isHoliday = dayOfWeek === 0 || dayOfWeek === 6 || holidays2026.includes(dateStr);
        if (dayOfWeek === 0) dayEl.classList.add('sun');
        if (dayOfWeek === 6) dayEl.classList.add('sat');
        if (isHoliday) dayEl.classList.add('is-holiday');
        
        if (workDays.includes(dateStr)) dayEl.classList.add('active');

        dayEl.onclick = () => toggleDay(dateStr, dayEl);
        grid.appendChild(dayEl);
    }
}

// 날짜 클릭 시 선택/해제
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

// ★ 핵심: 급여 계산 함수 (주휴수당 + 12.6% 공제 포함)
function calculateTotal() {
    let total = 0;
    let weeklyCount = {}; // 주차별 근무일수 카운트
    
    workDays.forEach(dateStr => {
        const d = new Date(dateStr);
        
        // 1. 기본 급여 (평일 1.0, 휴일 1.5)
        const isHoliday = d.getDay() === 0 || d.getDay() === 6 || holidays2026.includes(dateStr);
        const rate = isHoliday ? 1.5 : 1.0;
        total += currentWage * rate;

        // 2. 주휴수당 계산을 위해 주차 파악
        const weekNum = getWeekNumber(d);
        weeklyCount[weekNum] = (weeklyCount[weekNum] || 0) + 1;
    });

    // 3. 주휴수당 합산 (한 주 5일 이상 근무 시 하루치 일당 추가)
    let allowance = 0;
    Object.values(weeklyCount).forEach(count => {
        if (count >= 5) allowance += Number(currentWage);
    });

    const preTaxTotal = total + allowance; // 세전 총액

    // 4. 공제율 적용 (재상님 기준 12.6%)
    const taxRate = 0.126;
    const actualPay = preTaxTotal * (1 - taxRate);

    // 5. 화면 업데이트
    totalDisplay.innerText = `₩ ${preTaxTotal.toLocaleString()}`;
    if (actualDisplay) {
        actualDisplay.innerText = `₩ ${Math.floor(actualPay).toLocaleString()}`;
    }
    
    const summaryEl = document.querySelector('.summary-info');
    if (allowance > 0) {
        summaryEl.innerText = `주휴수당 포함 (공제 전)`;
    } else {
        summaryEl.innerText = `이번 달 예상 세전 총액`;
    }
}

// 주차 계산 보조 함수
function getWeekNumber(d) {
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    return Math.ceil((d.getDate() + firstDay) / 7);
}
