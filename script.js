// Initialize Supabase
const supabase = window.supabase.createClient(
  'https://axhvrjivepslousbzooi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aHZyaml2ZXBzbG91c2J6b29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzE0MDMsImV4cCI6MjA2ODkwNzQwM30.NtJPdCXZKgcXYz3whPgiVZC4_OTSHiBY4rDXcSFLPYs'
);

// DOM Elements
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const listEl = document.getElementById('transaction-list');
const emptyState = document.getElementById('empty-state');
const form = document.getElementById('tx-form');
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const themeToggle = document.getElementById('theme-toggle');
const resetBtn = document.getElementById('reset-btn');
const exportBtn = document.getElementById('export-btn');
const filterCategory = document.getElementById('filter-category');

let chart;
let transactions = [];

// Theme Management - Enhanced with system preference detection
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

  if (shouldBeDark) {
    document.documentElement.classList.add('dark');
    updateThemeToggle(true);
  } else {
    document.documentElement.classList.remove('dark');
    updateThemeToggle(false);
  }
}

function updateThemeToggle(isDark) {
  const isMobile = window.innerWidth < 640;
  if (isMobile) {
    themeToggle.innerHTML = `<span class="sm:hidden">${isDark ? '🌞' : '🌙'}</span><span class="hidden sm:inline">${isDark ? '🌞 Light Mode' : '🌙 Dark Mode'}</span>`;
  } else {
    themeToggle.innerHTML = `<span class="hidden sm:inline">${isDark ? '🌞 Light Mode' : '🌙 Dark Mode'}</span><span class="sm:hidden">${isDark ? '🌞' : '🌙'}</span>`;
  }
}

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeToggle(isDark);
  if (chart) {
    updateChart(); // Refresh chart colors for theme
  }
});

// Responsive theme toggle text on window resize
window.addEventListener('resize', () => {
  const isDark = document.documentElement.classList.contains('dark');
  updateThemeToggle(isDark);
});

// Load transactions from Supabase with fallback
async function loadFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading:', error.message);
      return;
    }

    transactions = data || [];
    updateUI();
  } catch (err) {
    console.error('Network error:', err);
    // Fallback with demo data for testing
    transactions = [];
    updateUI();
  }
}

// Enhanced UI Update with better responsive design
function updateUI() {
  let total = 0, income = 0, expense = 0;
  listEl.innerHTML = '';

  const selectedCategory = filterCategory?.value || 'all';

  const filteredTx = transactions.filter(tx => {
    return selectedCategory === 'all' || tx.category === selectedCategory;
  });

  // Show/hide empty state
  if (filteredTx.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    
    filteredTx.forEach((tx) => {
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200';
      
      // Category emojis for better visual organization
      const categoryEmoji = {
        'Income': '💰',
        'Food': '🍕',
        'Transport': '🚗',
        'Shopping': '🛍️',
        'Others': '📦'
      }[tx.category] || '📦';

      li.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="text-lg sm:text-xl">${categoryEmoji}</div>
          <div>
            <div class="font-medium text-sm sm:text-base">${tx.desc}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">${tx.category}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <span class="font-semibold text-sm sm:text-base ${tx.amount < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}">
            ${tx.amount < 0 ? '-' : '+'}Rp${Math.abs(tx.amount).toLocaleString()}
          </span>
          <button onclick="removeTx('${tx.id}')" class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 p-1" title="Delete transaction">
            ❌
          </button>
        </div>
      `;
      listEl.appendChild(li);

      // Calculate totals
      total += tx.amount;
      if (tx.amount > 0) income += tx.amount;
      else expense += Math.abs(tx.amount);
    });
  }

  // Update balance displays with better formatting
  balanceEl.textContent = `Rp ${total.toLocaleString()}`;
  incomeEl.textContent = `Rp ${income.toLocaleString()}`;
  expenseEl.textContent = `Rp ${expense.toLocaleString()}`;
  
  updateChart(income, expense);
}

// Remove transaction with better error handling
async function removeTx(id) {
  if (!confirm('Are you sure you want to delete this transaction?')) {
    return;
  }

  try {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
    await loadFromSupabase();
  } catch (err) {
    console.error('Error removing transaction:', err);
    // Fallback for demo/offline mode
    transactions = transactions.filter(tx => tx.id != id);
    updateUI();
  }
}

// Enhanced chart with theme-aware colors and responsiveness
function updateChart(income = 0, expense = 0) {
  const ctx = document.getElementById('financeChart').getContext('2d');
  const isDark = document.documentElement.classList.contains('dark');
  
  if (chart) chart.destroy();
  
  // Don't show chart if no data
  if (income === 0 && expense === 0) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = isDark ? '#6b7280' : '#9ca3af';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data to display', ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }
  
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: [
          isDark ? '#22c55e' : '#16a34a', // Green for income
          isDark ? '#ef4444' : '#dc2626'  // Red for expense
        ],
        borderColor: isDark ? '#374151' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDark ? '#e5e7eb' : '#374151',
            padding: 20,
            font: {
              size: window.innerWidth < 640 ? 12 : 14,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          titleColor: isDark ? '#f3f4f6' : '#111827',
          bodyColor: isDark ? '#f3f4f6' : '#111827',
          borderColor: isDark ? '#374151' : '#d1d5db',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `${context.label}: Rp ${context.parsed.toLocaleString()}`;
            }
          }
        }
      }
    }
  });
}

// Enhanced form submission with better validation
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;

  // Enhanced validation
  if (!desc) {
    alert("Please enter a description");
    descInput.focus();
    return;
  }
  if (isNaN(amount) || amount === 0) {
    alert("Please enter a valid amount");
    amountInput.focus();
    return;
  }
  if (!category) {
    alert("Please select a category");
    categoryInput.focus();
    return;
  }

  const txData = {
    desc,
    category,
    amount: category === 'Income' ? Math.abs(amount) : -Math.abs(amount),
    date: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from("transactions").insert([txData]);
    if (error) throw error;
    await loadFromSupabase();
  } catch (err) {
    console.error('Error adding transaction:', err);
    // Fallback for demo/offline mode
    transactions.unshift({
      id: Date.now(),
      ...txData
    });
    updateUI();
  }

  // Reset form
  descInput.value = '';
  amountInput.value = '';
  categoryInput.value = '';
  descInput.focus(); // Focus back to first input for quick entry
});

// Reset all transactions with confirmation
resetBtn.addEventListener('click', async () => {
  if (!confirm("Are you sure you want to delete all transactions? This action cannot be undone.")) {
    return;
  }

  try {
    const { error } = await supabase.from("transactions").delete().neq('id', '');
    if (error) throw error;
    await loadFromSupabase();
  } catch (err) {
    console.error('Error resetting transactions:', err);
    transactions = [];
    updateUI();
  }
});

// Enhanced CSV export with better formatting
exportBtn.addEventListener('click', () => {
  if (transactions.length === 0) {
    alert("No data to export!");
    return;
  }
  
  const csvContent = "data:text/csv;charset=utf-8," +
    ["Description,Category,Amount,Date", ...transactions.map(tx =>
      `"${tx.desc}","${tx.category}",${tx.amount},"${new Date(tx.date).toLocaleDateString('id-ID')}"`
    )].join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Filter functionality
filterCategory?.addEventListener('change', updateUI);

// Make removeTx globally available for onclick handlers
window.removeTx = removeTx;

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadFromSupabase();
});

// Handle window resize for chart responsiveness
window.addEventListener('resize', () => {
  if (chart) {
    setTimeout(() => {
      chart.resize();
    }, 100);
  }
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    if (e.matches) {
      document.documentElement.classList.add('dark');
      updateThemeToggle(true);
    } else {
      document.documentElement.classList.remove('dark');
      updateThemeToggle(false);
    }
    if (chart) updateChart();
  }
});

// Keyboard shortcuts for better UX
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + D to toggle dark mode
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault();
    themeToggle.click();
  }
  
  // Escape to clear form
  if (e.key === 'Escape') {
    if (descInput.value || amountInput.value || categoryInput.value) {
      if (confirm('Clear the form?')) {
        descInput.value = '';
        amountInput.value = '';
        categoryInput.value = '';
        descInput.focus();
      }
    }
  }
});
