export function localizeDateTime({ dateTime, timeZone }) {
  const time = new Date(dateTime).toLocaleString({
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZoneName: "short",
  });
  const date = new Date(dateTime).toLocaleString({
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return { time, date };
}
