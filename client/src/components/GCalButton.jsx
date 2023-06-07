import React from "react";

export function GCalButton({ title, description, start, duration }) {
  // format dates using format='Ymd\\THi00\\Z'
  const startDateFmt = new Date(start).toISOString().replace(/[-:]/g, "");
  const endDateFmt = new Date(Date.parse(start) + duration * 60 * 1000)
    .toISOString()
    .replace(/[-:]/g, "");

  // format comes from https://stackoverflow.com/a/21653600
  // docs(ish) here: https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startDateFmt}/${endDateFmt}`,
    details: description,
    location: `A link to a new HIT will be sent to you via email at the start of the session.`,
    trp: "true",
  });

  const url = `http://www.google.com/calendar/render?${params.toString()}`;
  console.log(url);
  return (
    <p>
      <a href={url} target="_blank" rel="nofollow">
        Add to Google Calendar
      </a>
    </p>
  );
}
