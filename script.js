const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const listEl = document.getElementById('transaction-list');
const form = document.getElementById('tx-form');
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const themeToggle = document.getElementById('theme-toggle');
const resetBtn = document.getElementById('reset-btn');
const exportBtn = document.getElementById('export-btn');
const filterCategory = document.getElementById('filter-category');
const filterMonth = document.getElementById('filter-month'); // kalau ada

let chart;
let transactions = [];

async function loadFromSupabase() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error loading:', error.message);
    return;
  }

  transactions = data;
  updateUI();
}

function updateUI() {
  let total = 0, income = 0, expense = 0;
  listEl.innerHTML = '';

  const selectedCategory = filterCategory?.value || 'all';
  const selectedMonth = filterMonth?.value || 'all';

  const filteredTx = transactions.filter(tx => {
    const txMonth = tx.date?.slice(0, 7);
    const categoryMatch = selectedCategory === 'all' || tx.category === selectedCategory;
    const monthMatch = selectedMonth === 'all' || txMonth === selectedMonth;
    return categoryMatch && monthMatch;
  });

  filteredTx.forEach((tx, index) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center bg-white dark:bg-gray-800 px-4 py-2 rounded shadow-sm';
    li.innerHTML = `
      <div>
        <div class="font-medium">${tx.desc}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">${tx.category}</div>
      </div>
      <div class="flex items-center gap-2">
        <span class="${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}">Rp${tx.amount.toLocaleString()}</span>
        <button onclick="removeTx('${tx.id}')" class="text-gray-400 hover:text-red-600">❌</button>
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
  renderChart(income, expense);
}

async function removeTx(id) {
  await supabase.from("transactions").delete().eq("id", id);
  await loadFromSupabase();
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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const desc = descInput.value.trim();
  const amount = +amountInput.value;
  const category = categoryInput.value;

  if (!desc || isNaN(amount) || !category) return alert("Please complete all fields");

  const txData = {
    desc,
    category,
    amount,
    date: new Date().toISOString()
  };

  await supabase.from("transactions").insert([txData]);

  descInput.value = '';
  amountInput.value = '';
  categoryInput.value = '';
  await loadFromSupabase();
});

resetBtn.addEventListener('click', async () => {
  if (confirm("Are you sure you want to delete all transactions?")) {
    await supabase.from("transactions").delete().neq('id', '');
    await loadFromSupabase();
  }
});

exportBtn.addEventListener('click', () => {
  if (transactions.length === 0) return alert("No data to export!");
  const csvContent = "data:text/csv;charset=utf-8," +
    ["Description,Category,Amount,Date", ...transactions.map(tx =>
      `"${tx.desc}","${tx.category}",${tx.amount},"${tx.date}"`)].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "transactions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeToggle.textContent = isDark ? '🌞 Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateUI();
});

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  themeToggle.textContent = '🌞 Light Mode';
}

filterCategory?.addEventListener('change', updateUI);
filterMonth?.addEventListener('change', updateUI);

loadFromSupabase();
