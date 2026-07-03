const LS_DEVICE_ID  = "mz_device_id";
const LS_LAST_VISIT = "mz_last_visit_day";

function getDeviceId() {
  let id = localStorage.getItem(LS_DEVICE_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LS_DEVICE_ID, id);
  }
  return id;
}

export function track(eventName, gameName = null) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_name: eventName, device_id: getDeviceId(), game_name: gameName }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function trackAppOpened() {
  try {
    const today   = new Date().toISOString().slice(0, 10);
    const lastDay = localStorage.getItem(LS_LAST_VISIT);
    track("app_opened");
    if (lastDay && lastDay !== today) track("returned");
    localStorage.setItem(LS_LAST_VISIT, today);
  } catch {}
}
