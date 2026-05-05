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
    const now = new Date(); // 2026년 5월 기준 (현재 시간 반영)
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const lastDay = new Date(year, month + 1, 0).getDate();

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
    workDays.forEach(dateStr => {
        const d = new Date(dateStr);
        const isHoliday = d.getDay() === 0 || d.getDay() === 6 || holidays2026.includes(dateStr);
        const rate = isHoliday ? 1.5 : 1.0;
        total += currentWage * rate;
    });
    totalDisplay.innerText = `₩ ${total.toLocaleString()}`;
}
