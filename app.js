// Trading Journal - app.js
// Stores data in localStorage so it works fully offline in the browser

const STORAGE_KEY = "tradingJournalEntries";

// Load existing entries from localStorage
function loadEntries() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Save entries back to localStorage
function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Render table rows
function renderTable() {
  const tbody = document.getElementById("journalBody");
  tbody.innerHTML = "";
  const entries = loadEntries();

  entries.forEach((entry, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.symbol}</td>
      <td>${entry.direction}</td>
      <td>${entry.entry}</td>
      <td>${entry.exit}</td>
      <td>${entry.qty}</td>
      <td>${entry.pnl}</td>
      <td>
        <button class="btn btn-ghost text-red-600" onclick="deleteEntry(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateStats(entries);
  updateChart(entries);
}

// Add a new entry
function addEntry(e) {
  e.preventDefault();

  const date = document.getElementById("date").value;
  const symbol = document.getElementById("symbol").value;
  const direction = document.getElementById("direction").value;
  const entry = parseFloat(document.getElementById("entry").value);
  const exit = parseFloat(document.getElementById("exit").value);
  const qty = parseInt(document.getElementById("qty").value);

  const pnl =
    direction === "LONG"
      ? ((exit - entry) * qty).toFixed(2)
      : ((entry - exit) * qty).toFixed(2);

  const newEntry = { date, symbol, direction, entry, exit, qty, pnl };

  const entries = loadEntries();
  entries.push(newEntry);
  saveEntries(entries);
  renderTable();

  document.getElementById("journalForm").reset();
}

// Delete an entry
function deleteEntry(index) {
  const entries = loadEntries();
  entries.splice(index, 1);
  saveEntries(entries);
  renderTable();
}

// Update stats (win rate, total PnL, etc.)
function updateStats(entries) {
  const totalPnL = entries.reduce((sum, e) => sum + parseFloat(e.pnl), 0);
  const wins = entries.filter((e) => parseFloat(e.pnl) > 0).length;
  const winRate = entries.length ? ((wins / entries.length) * 100).toFixed(1) : 0;

  document.getElementById("totalPnL").innerText = totalPnL.toFixed(2);
  document.getElementById("winRate").innerText = winRate + "%";
  document.getElementById("totalTrades").innerText = entries.length;
}

// Update chart.js performance graph
function updateChart(entries) {
  const ctx = document.getElementById("pnlChart").getContext("2d");
  const pnlProgress = entries.reduce((acc, e, i) => {
    const prev = i > 0 ? acc[i - 1] : 0;
    acc.push(prev + parseFloat(e.pnl));
    return acc;
  }, []);

  if (window.pnlChart) window.pnlChart.destroy();

  window.pnlChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: entries.map((e) => e.date),
      datasets: [
        {
          label: "Cumulative PnL",
          data: pnlProgress,
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79,70,229,0.1)",
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
      },
    },
  });
}

// Export CSV
function exportCSV() {
  const entries = loadEntries();
  if (!entries.length) return alert("No data to export!");

  const header = Object.keys(entries[0]).join(",");
  const rows = entries.map((e) => Object.values(e).join(","));
  const csv = [header, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "trading_journal.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Import CSV
function importCSV(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text.split("\n").map((line) => line.split(","));
    const [header, ...rows] = lines;

    const entries = rows
      .filter((r) => r.length === header.length)
      .map((r) => {
        const obj = {};
        header.forEach((h, i) => (obj[h] = r[i]));
        return obj;
      });

    saveEntries(entries);
    renderTable();
  };
  reader.readAsText(file);
}

// Attach event listeners
document.getElementById("journalForm").addEventListener("submit", addEntry);
document.getElementById("exportBtn").addEventListener("click", exportCSV);
document
  .getElementById("importFile")
  .addEventListener("change", (e) => importCSV(e.target.files[0]));

// Initial render
renderTable();
