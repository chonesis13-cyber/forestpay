let currentWage = localStorage.getItem('forest-pay-wage') || 0;
let workDays = JSON.parse(localStorage.getItem('forest-pay-days')) || []; // 선택된 날짜 저장
const holidays2026 = ["2026-05-05", "2026-05-24"]; // 예시 공휴일

const wageInput = document.getElementById('daily-wage');
const totalDisplay = document.getElementById('total-salary');
const grid = document.getElementById('calendar-grid');

// 초기화
wageInput.value = currentWage;
renderCalendar();
calculateTotal();

// 일당 입력 이벤트
wageInput.addEventListener('input', (e) => {
    currentWage = e.target.value;
    localStorage.setItem('forest-pay-wage', currentWage);
    calculateTotal();
});

function renderCalendar() {
    grid.innerHTML = '';
    const now = new Date(); 
    const year = now.getFullYear();
    const month = now.getMonth(); // 5월은 index 4입니다.
    
    // 1. 이번 달의 1일이 무슨 요일인지 계산 (0: 일요일, ... 5: 금요일)
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // 2. 이번 달의 마지막 날짜 계산
    const lastDay = new Date(year, month + 1, 0).getDate();

    // 3. 1일 시작 전까지 빈칸 채우기
    for (let x = 0; x < firstDayIndex; x++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day-empty'); // 스타일을 위해 클래스 추가
        grid.appendChild(emptyDiv);
    }

    // 4. 실제 날짜 채우기
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

function calculateTotal() {
    let total = 0;
    let weeklyCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // 각 주차별 근무일수 저장
    
    workDays.forEach(dateStr => {
        const d = new Date(dateStr);
        
        // 1. 기본 급여 계산 (주말/공휴일 1.5배)
        const isHoliday = d.getDay() === 0 || d.getDay() === 6 || holidays2026.includes(dateStr);
        const rate = isHoliday ? 1.5 : 1.0;
        total += currentWage * rate;

        // 2. 주휴수당을 위한 주차 계산 (월~일 기준)
        const weekNum = getWeekNumber(d);
        weeklyCount[weekNum] = (weeklyCount[weekNum] || 0) + 1;
    });

    // 3. 주휴수당 합산: 한 주에 5일 이상 근무 시 하루치 일당 추가
    let allowance = 0;
    Object.values(weeklyCount).forEach(count => {
        if (count >= 5) {
            allowance += Number(currentWage);
        }
    });

    total += allowance;

    // 화면 표시
    totalDisplay.innerText = `₩ ${total.toLocaleString()}`;
    
    // 주휴수당 발생 시 안내 문구 (선택 사항)
    const summaryEl = document.querySelector('.summary-info');
    if (allowance > 0) {
        summaryEl.innerText = `주휴수당 ${allowance.toLocaleString()}원 포함`;
        summaryEl.style.color = 'var(--forest-moss)'; // 이끼색으로 강조
    } else {
        summaryEl.innerText = `이번 달 예상 수령액`;
        summaryEl.style.color = 'inherit';
    }
}

// 해당 날짜가 그 달의 몇 번째 주인지 계산하는 함수
function getWeekNumber(d) {
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    return Math.ceil((d.getDate() + firstDay) / 7);
}

const resetBtn = document.getElementById('reset-btn');

resetBtn.addEventListener('click', () => {
    // 1. 사용자에게 확인 받기
    if (confirm("모든 근무 기록과 설정된 일당이 삭제됩니다. 초기화할까요?")) {
        
        // 2. 저장된 데이터 삭제
        localStorage.removeItem('forest-pay-wage');
        localStorage.removeItem('forest-pay-days');
        
        // 3. 변수 초기화 및 화면 새로고침
        currentWage = 0;
        workDays = [];
        
        // UI 반영
        wageInput.value = '';
        renderCalendar();
        calculateTotal();
        
        alert("기록이 맑게 정리되었습니다. 🌲");
    }
});
