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

    // Theme Management
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
        themeToggle.innerHTML = isDark ? '🌞' : '🌙';
      } else {
        themeToggle.innerHTML = isDark ? '🌞 Light Mode' : '🌙 Dark Mode';
      }
    }

    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateThemeToggle(isDark);
      if (chart) {
        updateChart(); // Refresh chart colors
      }
    });

    // Responsive theme toggle text
    window.addEventListener('resize', () => {
      const isDark = document.documentElement.classList.contains('dark');
      updateThemeToggle(isDark);
    });

    // Load transactions from Supabase
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
        // Use mock data for demo
        transactions = [
          { id: 1, desc: 'Salary', category: 'Income', amount: 5000000, date: new Date().toISOString() },
          { id: 2, desc: 'Lunch', category: 'Food', amount: -25000, date: new Date().toISOString() },
          { id: 3, desc: 'Bus Ticket', category: 'Transport', amount: -10000, date: new Date().toISOString() }
        ];
        updateUI();
      }
    }

    // Update UI
    function updateUI() {
      let total = 0, income = 0, expense = 0;
      listEl.innerHTML = '';

      const selectedCategory = filterCategory?.value || 'all';

      const filteredTx = transactions.filter(tx => {
        return selectedCategory === 'all' || tx.category === selectedCategory;
      });

      if (filteredTx.length === 0) {
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
        
        filteredTx.forEach((tx) => {
          const li = document.createElement('li');
          li.className = 'flex justify-between items-center p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200';
          
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
              <button onclick="removeTx('${tx.id}')" class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 p-1">
                ❌
              </button>
            </div>
          `;
          listEl.appendChild(li);

          total += tx.amount;
          if (tx.amount > 0) income += tx.amount;
          else expense += Math.abs(tx.amount);
        });
      }

      // Update balance display
      balanceEl.textContent = `Rp ${total.toLocaleString()}`;
      incomeEl.textContent = `Rp ${income.toLocaleString()}`;
      expenseEl.textContent = `Rp ${expense.toLocaleString()}`;
      
      updateChart(income, expense);
    }

    // Remove transaction
    async function removeTx(id) {
      try {
        await supabase.from("transactions").delete().eq("id", id);
        await loadFromSupabase();
      } catch (err) {
        // Fallback for demo
        transactions = transactions.filter(tx => tx.id != id);
        updateUI();
      }
    }

    // Update chart
    function updateChart(income = 0, expense = 0) {
      const ctx = document.getElementById('financeChart').getContext('2d');
      const isDark = document.documentElement.classList.contains('dark');
      
      if (chart) chart.destroy();
      
      chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Income', 'Expense'],
          datasets: [{
            data: [income || 0.1, expense || 0.1], // Prevent empty chart
            backgroundColor: [
              isDark ? '#22c55e' : '#16a34a',
              isDark ? '#ef4444' : '#dc2626'
            ],
            borderWidth: 0,
            hoverOffset: 4
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
                  size: window.innerWidth < 640 ? 12 : 14
                }
              }
            }
          }
        }
      });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const desc = descInput.value.trim();
      const amount = +amountInput.value;
      const category = categoryInput.value;

      if (!desc || isNaN(amount) || !category) {
        alert("Please complete all fields");
        return;
      }

      const txData = {
        desc,
        category,
        amount: category === 'Income' ? Math.abs(amount) : -Math.abs(amount),
        date: new Date().toISOString()
      };

      try {
        await supabase.from("transactions").insert([txData]);
        await loadFromSupabase();
      } catch (err) {
        // Fallback for demo
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
    });

    // Reset all transactions
    resetBtn.addEventListener('click', async () => {
      if (confirm("Are you sure you want to delete all transactions?")) {
        try {
          await supabase.from("transactions").delete().neq('id', '');
          await loadFromSupabase();
        } catch (err) {
          transactions = [];
          updateUI();
        }
      }
    });

    // Export to CSV
    exportBtn.addEventListener('click', () => {
      if (transactions.length === 0) {
        alert("No data to export!");
        return;
      }
      
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

    // Filter events
    filterCategory?.addEventListener('change', updateUI);

    // Make removeTx globally available
    window.removeTx = removeTx;

    // Initialize
    initTheme();
    loadFromSupabase();

    // Handle window resize for chart
    window.addEventListener('resize', () => {
      if (chart) {
        setTimeout(() => {
          chart.resize();
        }, 100);
      }
    });
