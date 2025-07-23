<script>
  const transactions = [
    { desc: 'Salary', amount: 5000000 },
    { desc: 'Freelance', amount: 2000000 },
    { desc: 'Groceries', amount: -1000000 },
    { desc: 'Internet', amount: -500000 },
    { desc: 'Coffee', amount: -150000 },
  ];

  const balanceEl = document.getElementById('balance');
  const incomeEl = document.getElementById('income');
  const expenseEl = document.getElementById('expense');
  const listEl = document.getElementById('transaction-list');

  let total = 0;
  let income = 0;
  let expense = 0;

  listEl.innerHTML = '';
  transactions.forEach((tx) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center bg-white dark:bg-gray-800 px-4 py-2 rounded shadow-sm';
    li.innerHTML = `
      <span>${tx.desc}</span>
      <span class="${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}">Rp${tx.amount.toLocaleString()}</span>
    `;
    listEl.appendChild(li);

    total += tx.amount;
    if (tx.amount > 0) income += tx.amount;
    else expense += Math.abs(tx.amount);
  });

  balanceEl.textContent = `Rp ${total.toLocaleString()}`;
  incomeEl.textContent = `Rp ${income.toLocaleString()}`;
  expenseEl.textContent = `Rp ${expense.toLocaleString()}`;

  // Chart
  const ctx = document.getElementById('financeChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#16a34a', '#dc2626'],
        borderWidth: 1
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
</script>
