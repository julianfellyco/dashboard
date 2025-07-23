const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const listEl = document.getElementById('transaction-list');
const form = document.getElementById('tx-form');
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const themeToggle = document.getElementById('theme-toggle');
let chart;

// Load transactions
let transactions = JSON.parse(localStorage.getItem('transactions')) || [
  { desc: 'Salary', amount: 5000000 },
  { desc: 'Groceries', amount: -1000000 }
];

function updateUI() {
  let total = 0, income = 0, expense = 0;
  listEl.innerHTML = '';

  transactions.forEach((tx, index) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center bg-white dark:bg-gray-800 px-4 py-2 rounded shadow-sm';
    li.innerHTML = `
      <span>${tx.desc}</span>
      <div class="flex items-center gap-2">
        <span class="${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}">Rp${tx.amount.toLocaleString()}</span>
        <button onclick="removeTx(${index})" class="text-gray-400 hover:text-red-600">❌</button>
      </div>
    `;
    listEl.appendChild(li);

    total += tx.amount;
    if (tx.amount > 0) income += tx.amount;
    else expense += Math.abs(tx.amount);
  });

  balanceEl.textContent = `Rp ${total.toLocaleString()}`;
  incomeEl.textContent = `Rp ${income.toLocaleString()}`;
  expenseEl.textContent = `Rp ${expense.toLocaleString()}`;

  localStorage.setItem('transactions', JSON.stringify(transactions));
  renderChart(income, expense);
}

function renderChart(income, expense) {
  const ctx = document.getElementById('financeChart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#16a34a', '#dc2626']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: document.body.classList.contains('dark') ? 'white' : 'black'
          }
        }
      }
    }
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const desc = descInput.value.trim();
  const amount = +amountInput.value;

  if (!desc || isNaN(amount)) return alert("Please enter valid data");

  transactions.push({ desc, amount });
  descInput.value = '';
  amountInput.value = '';
  updateUI();
});
const resetBtn = document.getElementById('reset-btn');

resetBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to delete all transactions?")) {
    transactions = [];
    localStorage.removeItem('transactions');
    updateUI();
  }
});

function removeTx(index) {
  transactions.splice(index, 1);
  updateUI();
}
const exportBtn = document.getElementById('export-btn');

exportBtn.addEventListener('click', () => {
  if (transactions.length === 0) {
    alert("No data to export!");
    return;
  }

  const csvContent = "data:text/csv;charset=utf-8," + 
    ["Description,Amount", ...transactions.map(tx => `"${tx.desc}",${tx.amount}`)].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "transactions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});


// Theme Handling
const userPref = localStorage.getItem('theme');
if (userPref === 'dark') {
  document.body.classList.add('dark');
  themeToggle.textContent = '🌞 Light Mode';
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeToggle.textContent = isDark ? '🌞 Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateUI(); // re-render chart with correct label color
});

updateUI();
