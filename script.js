let currentWage = localStorage.getItem('forest-pay-wage') || 0;
let monthlyLeavePay = localStorage.getItem('forest-pay-leave') || 0;
let workData = JSON.parse(localStorage.getItem('forest-pay-data-obj')) || {};
let viewDate = new Date(); 

const holidays2026 = ["2026-01-01", "2026-02-16", "2026-02-17", "2026-02-18", "2026-03-01", "2026-03-02", "2026-05-01", "2026-05-05", "2026-05-24", "2026-05-25", "2026-06-06", "2026-08-15", "2026-08-17", "2026-09-24", "2026-09-25", "2026-09-26", "2026-10-03", "2026-10-05", "2026-10-09", "2026-12-25"];

const wageInput = document.getElementById('daily-wage');
const leaveInput = document.getElementById('monthly-leave-pay');
const totalDisplay = document.getElementById('total-salary');
const actualDisplay = document.getElementById('actual-salary');
const grid = document.getElementById('calendar-grid');
const monthDisplay = document.getElementById('current-month');
const resetBtn = document.getElementById('reset-btn');

// 초기값 세팅
wageInput.value = currentWage;
leaveInput.value = monthlyLeavePay;
renderCalendar();
calculateTotal();

// 입력 이벤트
wageInput.addEventListener('input', (e) => {
    currentWage = e.target.value;
    localStorage.setItem('forest-pay-wage', currentWage);
    calculateTotal();
});

leaveInput.addEventListener('input', (e) => {
    monthlyLeavePay = e.target.value;
    localStorage.setItem('forest-pay-leave', monthlyLeavePay);
    calculateTotal();
});

// 월 이동
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
            currentWage = 0; monthlyLeavePay = 0; workData = {};
            wageInput.value = ''; leaveInput.value = '';
            renderCalendar(); calculateTotal();
        }
    });
}

function renderCalendar() {
    if (!grid) return;
    grid.innerHTML = '';
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
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
        
        if (dayOfWeek === 0) dayEl.classList.add('sun');
        if (dayOfWeek === 6) dayEl.classList.add('sat');
        if (holidays2026.includes(dateStr)) dayEl.classList.add('is-holiday');
        
        if (workData[dateStr] === "regular") dayEl.classList.add('active');
        if (workData[dateStr] === "extra") dayEl.classList.add('active', 'extra');

        dayEl.onclick = () => toggleDay(dateStr, dayEl);
        grid.appendChild(dayEl);
    }
}

function toggleDay(dateStr, el) {
    if (!workData[dateStr]) {
        workData[dateStr] = "regular";
        el.classList.add('active');
    } else if (workData[dateStr] === "regular") {
        workData[dateStr] = "extra";
        el.classList.add('extra');
    } else {
        delete workData[dateStr];
        el.classList.remove('active', 'extra');
    }
    localStorage.setItem('forest-pay-data-obj', JSON.stringify(workData));
    calculateTotal();
}

function calculateTotal() {
    let total = 0;
    let weeklyCount = {}; 
    
    Object.keys(workData).forEach(dateStr => {
        const d = new Date(dateStr);
        if (d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth()) {
            total += (workData[dateStr] === "extra") ? currentWage * 1.5 : currentWage * 1.0;
            const weekNum = getWeekNumber(d);
            weeklyCount[weekNum] = (weeklyCount[weekNum] || 0) + 1;
        }
    });

    let allowance = 0;
    Object.values(weeklyCount).forEach(count => { if (count >= 5) allowance += Number(currentWage); });

    const preTaxTotal = total + allowance + Number(monthlyLeavePay);
    const actualPay = preTaxTotal * (1 - 0.126);

    totalDisplay.innerText = `₩ ${Math.floor(preTaxTotal).toLocaleString()}`;
    if (actualDisplay) actualDisplay.innerText = `₩ ${Math.floor(actualPay).toLocaleString()}`;
    
    const summaryEl = document.querySelector('.summary-info');
    if (summaryEl) {
        let txt = allowance > 0 ? "주휴수당 포함" : "이번 달 정산액";
        if (Number(monthlyLeavePay) > 0) txt += " (월차 포함)";
        summaryEl.innerText = txt;
    }
}

function getWeekNumber(d) {
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    return Math.ceil((d.getDate() + firstDay) / 7);
}
