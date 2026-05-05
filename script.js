/**
 * Forest Pay - 재상님 맞춤형 최종본
 * 1. 5/1, 5/5 클릭 시 가산 수당 없이 1.0배 적용
 * 2. 12.6% 보수적 공제 적용
 * 3. 주휴수당 계산 포함
 */

let currentWage = localStorage.getItem('forest-pay-wage') || 0;
let workDays = JSON.parse(localStorage.getItem('forest-pay-days')) || []; 

const holidays2026 = ["2026-01-01", "2026-03-01", "2026-05-05", "2026-05-24", "2026-06-06", "2026-08-15", "2026-10-03", "2026-10-09", "2026-12-25"];
const specialHolidays = ["2026-05-01", "2026-05-05"]; 

const wageInput = document.getElementById('daily-wage');
const totalDisplay = document.getElementById('total-salary');
const actualDisplay = document.getElementById('actual-salary');
const grid = document.getElementById('calendar-grid');
const resetBtn = document.getElementById('reset-btn');

wageInput.value = currentWage;
renderCalendar();
calculateTotal();

wageInput.addEventListener('input', (e) => {
    currentWage = e.target.value;
    localStorage.setItem('forest-pay-wage', currentWage);
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

function renderCalendar() {
    if (!grid) return;
    grid.innerHTML = '';
    const year = 2026;
    const month = 4; // 5월 (JS는 0부터 시작)
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let x = 0; x < firstDayIndex; x++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day-empty');
        grid.appendChild(emptyDiv);
    }

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
    let weeklyCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    workDays.forEach(dateStr => {
        const d = new Date(dateStr);
        const isSunOrSat = d.getDay() === 0 || d.getDay() === 6;
        const isPublicHoliday = holidays2026.includes(dateStr);
        
        // [재상님 요청 로직] 5/1, 5/5는 클릭 시 1.0배, 그 외 휴일은 1.5배
        if (specialHolidays.includes(dateStr)) {
            total += currentWage * 1.0;
        } else if (isSunOrSat || isPublicHoliday) {
            total += currentWage * 1.5;
        } else {
            total += currentWage * 1.0;
        }

        const weekNum = getWeekNumber(d);
        weeklyCount[weekNum] = (weeklyCount[weekNum] || 0) + 1;
    });

    let allowance = 0;
    Object.values(weeklyCount).forEach(count => {
        if (count >= 5) allowance += Number(currentWage);
    });

    const preTaxTotal = total + allowance;
    const taxRate = 0.126; // 12.6% 공제
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
