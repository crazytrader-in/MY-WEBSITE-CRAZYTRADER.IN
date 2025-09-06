let trades = JSON.parse(localStorage.getItem("trades")) || [];
const form = document.getElementById("journalForm");
const journalBody = document.getElementById("journalBody");
const totalPnL = document.getElementById("totalPnL");
const winRate = document.getElementById("winRate");
const totalTrades = document.getElementById("totalTrades");
const importFile = document.getElementById("importFile");
const exportBtn = document.getElementById("exportBtn");

let pnlChart;

// --- Render Table ---
function renderTrades() {
  journalBody.innerHTML = "";
  trades.forEach((trade, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="p-3">${trade.date}</td>
      <td class="p-3">${trade.symbol}</td>
      <td class="p-3">${trade.direction}</td>
      <td class="p-3">${trade.entry}</td>
      <td class="p-3">${trade.exit}</td>
      <td class="p-3">${trade.qty}</td>
      <td class="p-3 font-bold ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}">${trade.pnl}</td>
      <td class="p-3">${trade.reason}</td>
      <td class="p-3"><button onclick="deleteTrade(${index})" class="text-red-400 hover:underline">Delete</button></td>
    `;
    journalBody.appendChild(row);
  });
  updateStats();
  updateChart();
  localStorage.setItem("trades", JSON.stringify(trades));
}

// --- Update Stats ---
function updateStats() {
  let total = trades.reduce((acc, t) => acc + t.pnl, 0);
  totalPnL.textContent = `₹${total.toFixed(2)}`;
  totalTrades.textContent = trades.length;

  let wins = trades.filter(t => t.pnl > 0).length;
  winRate.textContent = trades.length ? `${((wins / trades.length) * 100).toFixed(1)}%` : "0%";
}

// --- Chart ---
function updateChart() {
  let labels = trades.map(t => t.date);
  let pnlData = trades.map(t => t.pnl);

  if (pnlChart) pnlChart.destroy();

  const ctx = document.getElementById("pnlChart").getContext("2d");
  pnlChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "PnL",
        data: pnlData,
        borderColor: "#a855f7",
        backgroundColor: "rgba(168,85,247,0.2)",
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#ccc" } } },
      scales: {
        x: { ticks: { color: "#aaa" }, grid: { color: "#333" } },
        y: { ticks: { color: "#aaa" }, grid: { color: "#333" } }
      }
    }
  });
}

// --- Add Trade ---
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const trade = {
    date: form.date.value,
    symbol: form.symbol.value,
    direction: form.direction.value,
    entry: parseFloat(form.entry.value),
    exit: parseFloat(form.exit.value),
    qty: parseInt(form.qty.value),
    reason: form.reason.value,
  };
  trade.pnl = (trade.exit - trade.entry) * trade.qty * (trade.direction === "LONG" ? 1 : -1);

  trades.push(trade);
  renderTrades();
  form.reset();
});

// --- Delete Trade ---
function deleteTrade(index) {
  trades.splice(index, 1);
  renderTrades();
}

// --- Export CSV ---
exportBtn.addEventListener("click", () => {
  let csv = "Date,Symbol,Direction,Entry,Exit,Qty,PnL,Reason\n";
  trades.forEach(t => {
    csv += `${t.date},${t.symbol},${t.direction},${t.entry},${t.exit},${t.qty},${t.pnl},${t.reason}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "trading_journal.csv";
  a.click();
});

// --- Import CSV ---
importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const rows = event.target.result.split("\n").slice(1);
    rows.forEach(row => {
      const [date, symbol, direction, entry, exit, qty, pnl, reason] = row.split(",");
      if (date) trades.push({ date, symbol, direction, entry: +entry, exit: +exit, qty: +qty, pnl: +pnl, reason });
    });
    renderTrades();
  };
  reader.readAsText(file);
});

// --- Init ---
renderTrades();
