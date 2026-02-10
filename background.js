let activeTabId = null;
let startTime = null;

const productiveSites = [
  "leetcode.com",
  "geeksforgeeks.org",
  "github.com",
  "developer.mozilla.org",
  "w3schools.com",
  "coursera.org",
  "udemy.com",
  "khanacademy.org"
];

function isProductive(url) {
  return productiveSites.some(site => url.includes(site));
}

chrome.tabs.onActivated.addListener(async (info) => {
  try {
    const tab = await chrome.tabs.get(info.tabId);
    handleTabChange(tab);
  } catch (e) {
    console.error(e);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    handleTabChange(tab);
  }
});

function handleTabChange(tab) {
  if (!tab || !tab.url) return;

  const now = Date.now();

  if (activeTabId && startTime) {
    const duration = Math.floor((now - startTime) / 1000);

    chrome.storage.local.get(["timeData", "points"], (res) => {
      const data = res.timeData || {};
      const points = res.points || 0;

      if (isProductive(tab.url)) {
        const topic = new URL(tab.url).hostname;
        data[topic] = (data[topic] || 0) + duration;

        // 1 point per 10 seconds
        const earned = Math.floor(duration / 10);

        chrome.storage.local.set({
          timeData: data,
          points: points + earned,
          lastActive: new Date().toDateString()
        });
      }
    });
  }

  if (isProductive(tab.url)) {
    activeTabId = tab.id;
    startTime = now;
  } else {
    activeTabId = null;
    startTime = null;
  }
}