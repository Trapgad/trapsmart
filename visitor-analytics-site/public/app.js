const consentKey = "visitor-analytics-consent";
const consentPanel = document.getElementById("consent");

function getBrowserFamily() {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua) && !/Chromium\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  return "Other";
}

function getDeviceCategory() {
  if (/iPad|Tablet/i.test(navigator.userAgent)) return "Tablet";
  if (/Mobile|Android|iPhone|iPod/i.test(navigator.userAgent)) return "Mobile";
  return "Desktop";
}

async function recordPageView() {
  const response = await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ browser: getBrowserFamily(), device: getDeviceCategory() }),
    keepalive: true
  });
  if (!response.ok) throw new Error("Could not record analytics");
}

const savedConsent = localStorage.getItem(consentKey);
if (savedConsent === "accepted") {
  recordPageView().catch(error => console.error(error));
} else if (savedConsent !== "rejected") {
  consentPanel.hidden = false;
}

document.getElementById("accept-analytics").addEventListener("click", () => {
  localStorage.setItem(consentKey, "accepted");
  consentPanel.hidden = true;
  recordPageView().catch(error => console.error(error));
});

document.getElementById("reject-analytics").addEventListener("click", () => {
  localStorage.setItem(consentKey, "rejected");
  consentPanel.hidden = true;
});

document.getElementById("privacy-settings").addEventListener("click", () => {
  consentPanel.hidden = false;
});

document.getElementById("analytics-form").addEventListener("submit", async event => {
  event.preventDefault();
  const token = document.getElementById("admin-token").value;
  const errorElement = document.getElementById("analytics-error");
  const results = document.getElementById("analytics-results");
  errorElement.textContent = "";
  results.replaceChildren();

  try {
    const response = await fetch("/api/analytics", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load analytics");

    const heading = document.createElement("h3");
    heading.textContent = `${data.pageViews} opted-in page views`;
    const details = document.createElement("p");
    details.textContent = data.updatedAt ? `Last updated: ${new Date(data.updatedAt).toLocaleString()}` : "No analytics recorded yet.";
    const browserList = formatBreakdown("Browsers", data.browsers);
    const deviceList = formatBreakdown("Device categories", data.devices);
    results.append(heading, details, browserList, deviceList);
  } catch (error) {
    errorElement.textContent = error.message;
  }
});

function formatBreakdown(label, values) {
  const section = document.createElement("section");
  const heading = document.createElement("h4");
  heading.textContent = label;
  const list = document.createElement("ul");
  for (const [name, count] of Object.entries(values)) {
    const item = document.createElement("li");
    item.textContent = `${name}: ${count}`;
    list.append(item);
  }
  section.append(heading, list);
  return section;
}
