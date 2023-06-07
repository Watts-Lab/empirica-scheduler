const timers = new Map();

export async function registerTimer({
  callback,
  launchDate,
  offset,
  timerName, // completely unique name for the timer, but consistent across server restarts.
  // If timerName includes the game id, can be used to deregister timers for a particular game
}) {
  // the timer is relative to the lanchDate of the timeSlot
  // offset is the number of seconds before the launch date that the timer should expire
  const msUntilLaunchDate = Date.parse(launchDate) - Date.now();
  const msRemaining = msUntilLaunchDate - offset * 1000;

  if (msRemaining < 0) {
    console.log(
      `timer is ${msRemaining / 1000} seconds in the past, not starting timer`,
      timerName
    );
    return;
  }

  if (timers.has(timerName)) {
    console.log(`timer "${timerName}" already exists, not starting timer`);
    return;
  }

  console.log(`setting timer "${timerName}"`);
  timers.set(timerName, setTimeout(callback, msUntilLaunchDate));
}

export async function deregisterTimersMatching({ substring }) {
  const matchingTimers = Array.from(timers.keys()).filter((key) => key.includes(substring));
  console.log(`clearing timers matching "${substring}"`, matchingTimers);
  matchingTimers.forEach((key) => {
    clearTimeout(timers.get(key));
    timers.delete(key);
  });
}
