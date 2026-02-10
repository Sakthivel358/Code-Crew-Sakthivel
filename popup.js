document.addEventListener("DOMContentLoaded", () => {

  /* ================= DARK MODE TOGGLE ================= */
  const toggle = document.getElementById("darkToggle");

  chrome.storage.local.get(["darkMode"], (res) => {
    if (res.darkMode) {
      document.body.classList.add("dark");
      toggle.checked = true;
    }
  });

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      document.body.classList.add("dark");
      chrome.storage.local.set({ darkMode: true });
    } else {
      document.body.classList.remove("dark");
      chrome.storage.local.set({ darkMode: false });
    }
  });

  /* ================= MAIN DATA LOAD ================= */
  chrome.storage.local.get(
    ["timeData", "points", "streak", "lastActive"],
    (res) => {
      const data = res.timeData || {};
      const points = res.points || 0;
      const streak = updateStreak(res);

      const totalSeconds = Object.values(data).reduce((a, b) => a + b, 0);

      document.getElementById("time").innerText =
        Math.floor(totalSeconds / 60) + " min";

      document.getElementById("points").innerText =
        "Points: " + points;

      document.getElementById("streak").innerText =
        "Streak: " + streak;

      drawChart(data);
      showInsight(data);
    }
  );

  /* ================= BUTTON ACTIONS ================= */
  document.getElementById("restore").onclick = () => {
    chrome.storage.local.get(["points", "streak"], (res) => {
      if ((res.points || 0) >= 50) {
        chrome.storage.local.set({
          points: res.points - 50,
          streak: (res.streak || 0) + 1
        }, () => location.reload());
      }
    });
  };

  document.getElementById("exportCsv").onclick = () => {
    chrome.storage.local.get("timeData", (res) => {
      let csv = "Topic,Minutes\n";
      Object.entries(res.timeData || {}).forEach(([k, v]) => {
        csv += `${k},${Math.floor(v / 60)}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download({
        url,
        filename: "weekly_report.csv"
      });
    });
  };
});

/* ================= HELPERS ================= */

function updateStreak(res) {
  const today = new Date().toDateString();
  let streak = res.streak || 0;

  if (res.lastActive !== today) {
    streak++;
    chrome.storage.local.set({
      streak,
      lastActive: today
    });
  }
  return streak;
}

function drawChart(data) {
  const canvas = document.getElementById("chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let x = 10;
  Object.entries(data).forEach(([topic, sec]) => {
    const h = sec / 30; // scale
    ctx.fillStyle = "#1f6feb";
    ctx.fillRect(x, 100 - h, 30, h);
    ctx.fillText(topic.split(".")[0], x, 115);
    x += 45;
  });
}

function showInsight(data) {
  if (!Object.keys(data).length) {
    document.getElementById("insight").innerText = "No data yet";
    return;
  }

  let minTopic = Object.entries(data)
    .sort((a, b) => a[1] - b[1])[0];

  document.getElementById("insight").innerText =
    "You are lagging in " + minTopic[0] +
    ". Spend 20 minutes daily revising basics and solving problems.";
}