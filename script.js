// [1] 변수 설정 및 초기화
let currentWage = localStorage.getItem('forest-pay-wage') || 0;
let workDays = JSON.parse(localStorage.getItem('forest-pay-days')) || []; 

// 현재 보고 있는 달력을 추적하기 위한 날짜 객체 (기본값: 오늘)
let viewDate = new Date(); 

const holidays2026 = ["2026-01-01", "2026-03-01", "2026-05-05", "2026-05-24", "2026-06-06", "2026-08-15", "2026-10-03", "2026-10-09", "2026-12-25"];
const specialHolidays = ["2026-05-01", "2026-05-05"]; 

const wageInput = document.getElementById('daily-wage');
const totalDisplay = document.getElementById('total-salary');
const actualDisplay = document.getElementById('actual-salary');
const grid = document.getElementById('calendar-grid');
const monthDisplay = document.getElementById('current-month');
const resetBtn = document.getElementById('reset-btn');

wageInput.value = currentWage;

// 초기 실행
renderCalendar();
calculateTotal();

// [2] 이벤트 리스너
wageInput.addEventListener('input', (e) => {
    currentWage = e.target.value;
    localStorage.setItem('forest-pay-wage', currentWage);
    calculateTotal();
});

// 이전 달/다음 달 이동 버튼 이벤트
document.getElementById('prev-month').addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderCalendar();
    calculateTotal();
});

document.getElementById('next-month').addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderCalendar();
    calculateTotal();
});

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm("모든 기록을 초기화할까요?")) {
            localStorage.clear();
            currentWage = 0;
            workDays = [];
            wageInput.value = '';
            renderCalendar();
            calculateTotal();
        }
    });
}

// [3] 달력 그리기 함수
function renderCalendar() {
    if (!grid) return;
    grid.innerHTML = '';
    
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // 헤더 텍스트 업데이트 (예: 2026년 5월)
    monthDisplay.innerText = `${year}년 ${month + 1}월`;
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let x = 0; x < firstDayIndex; x++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day-empty');
        grid.appendChild(emptyDiv);
    }

    for (let i = 1; i <= lastDay; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, month, i).getDay();
        
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

// [4] 계산 로직 (기존 유지)
function calculateTotal() {
    let total = 0;
    let weeklyCount = {}; 
    
    workDays.forEach(dateStr => {
        const d = new Date(dateStr);
        // 현재 보고 있는 월의 데이터만 계산에 포함 (다른 달 기록은 제외)
        if (d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth()) {
            const isSunOrSat = d.getDay() === 0 || d.getDay() === 6;
            const isPublicHoliday = holidays2026.includes(dateStr);
            
            if (specialHolidays.includes(dateStr)) {
                total += currentWage * 1.0;
            } else if (isSunOrSat || isPublicHoliday) {
                total += currentWage * 1.5;
            } else {
                total += currentWage * 1.0;
            }

            const weekNum = getWeekNumber(d);
            weeklyCount[weekNum] = (weeklyCount[weekNum] || 0) + 1;
        }
    });

    let allowance = 0;
    Object.values(weeklyCount).forEach(count => {
        if (count >= 5) allowance += Number(currentWage);
    });

    const preTaxTotal = total + allowance;
    const taxRate = 0.126;
    const actualPay = preTaxTotal * (1 - taxRate);

    if (totalDisplay) totalDisplay.innerText = `₩ ${Math.floor(preTaxTotal).toLocaleString()}`;
    if (actualDisplay) actualDisplay.innerText = `₩ ${Math.floor(actualPay).toLocaleString()}`;
    
    const summaryEl = document.querySelector('.summary-info');
    if (summaryEl) {
        summaryEl.innerText = allowance > 0 ? "주휴수당 포함 (세전)" : "이번 달 예상 세전 총액";
    }
}

function getWeekNumber(d) {
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    return Math.ceil((d.getDate() + firstDay) / 7);
}
