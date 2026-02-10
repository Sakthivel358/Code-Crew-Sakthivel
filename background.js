const PRODUCTIVE_SITES = [
  "geeksforgeeks.org",
  "wikipedia.org",
  "coursera.org",
  "khanacademy.org",
  "nptel.ac.in"
];

let activeUrl = null;
let startTime = null;

function isProductive(url) {
  return PRODUCTIVE_SITES.some(site => url && url.includes(site));
}

function getTopic(url) {
  return PRODUCTIVE_SITES.find(site => url.includes(site)) || "Other";
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  handleTab(tab.url);
});

chrome.tabs.onUpdated.addListener((_, info, tab) => {
  if (info.status === "complete") {
    handleTab(tab.url);
  }
});

function handleTab(url) {
  if (activeUrl && startTime) saveTime();
  if (isProductive(url)) {
    activeUrl = url;
    startTime = Date.now();
  } else {
    activeUrl = null;
    startTime = null;
  }
}

function saveTime() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  const topic = getTopic(activeUrl);

  chrome.storage.local.get(["timeData", "points"], res => {
    const timeData = res.timeData || {};
    timeData[topic] = (timeData[topic] || 0) + seconds;

    const points = (res.points || 0) + Math.floor(seconds / 10);

    chrome.storage.local.set({ timeData, points });
  });
}

chrome.alarms.create("dailyReminder", { periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener(() => {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon.png",
    title: "Focused Reminder",
    message: "Study today to keep your learning streak!"
  });
});