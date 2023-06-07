/* eslint-disable no-restricted-syntax */
import _ from 'lodash';
import { notifyWorkers } from './mturk';
import { registerTimer } from './timers';
import { localizeDateTime } from './utils';

export async function sendReminder({ players, timeSlot }) {
  // Send a reminder email to each player
  // with the details of the slot they signed up for.
  //
  // These are localized by the workers timezone,
  // so need to be sent in groups by timezone.
  //
  // Reminders are othewise generic, so the same message gets sent
  // regardless of whether it is a 24 hr reminder or a 15 min reminder.

  const playersByTimeZone = _.groupBy(players, (player) => player.get('timeZone'));

  for (const [groupPlayers, timeZone] of Object.entries(playersByTimeZone)) {
    const { time, date } = localizeDateTime({
      dateTime: timeSlot.launchDate,
      timeZone,
    });

    const fmtHit = timeSlot.name.replace(/ /g, '+');
    const fmtRequester = process.env.MTURK_REQUESTER_NAME.replace(/ /g, '+');
    const searchTerms = encodeURIComponent(`${fmtHit}+${fmtRequester}`);

    const WorkerIds = _.map(groupPlayers, 'id');
    const Subject = `Reminder: Multiplayer HIT on ${date} at ${time}`;
    const MessageText = `
Thank you for signing up for the multi-participant HIT with the following details:

Session Name: ${timeSlot.name}
Session Date: ${date}
Session Time: ${time}
Session Duration: ${timeSlot.duration} Minutes
Session Requirements: 
${timeSlot.requirements.map((req) => `  - ${req}`).join('\n')}

This is the reminder that you signed up for.

At the scheduled time, you can search for the HIT using the following link:
https://worker.mturk.com/projects?filters%5Bsearch_term%5D=${searchTerms}

Thanks for participating!
`;

    notifyWorkers({ WorkerIds, Subject, MessageText });
  }
}

export async function scheduleReminder({ game, timeSlot, reminderName, offset }) {
  // set up a timer to remind players in the game who signed up for a reminder
  // named `reminderName` at `offset` minutes before the launch date

  const { launchDate } = timeSlot;

  const callback = () => {
    console.log(`Sending reminder: ${reminderName} for study launching at ${launchDate}`);
    const players = game.players.filter(
      (player) =>
        player.get(reminderName) && // player signed up for this reminder
        player.get('timeSlot')?.launchDate === launchDate // player signed up for this timeslot
    );
    sendReminder({ players, timeSlot });
  };

  registerTimer({
    callback,
    launchDate,
    offset,
    timerName: `${reminderName}_${launchDate}_${game.id}`,
  });
}

export async function sendConfirmationEmail({ player, timeSlot }) {
  const { time, date } = localizeDateTime({
    dateTime: timeSlot.launchDate,
    timeZone: player.get('timeZone'),
  });

  const fmtHit = timeSlot.name.replace(/ /g, '+');
  const fmtRequester = process.env.MTURK_REQUESTER_NAME.replace(/ /g, '+');
  const searchTerms = encodeURIComponent(`${fmtHit}+${fmtRequester}`);

  const Subject = `Confirmation: Multiplayer HIT on ${date} at ${time}`;
  const MessageText = `
Thank you for signing up for the multi-participant HIT with the following details:

Session Name: ${timeSlot.name}
Session Date: ${date}
Session Time: ${time}
Session Duration: ${timeSlot.duration} Minutes
Session Requirements:
${timeSlot.requirements.map((req) => `  - ${req}`).join('\n')}

At the scheduled time, you can search for the HIT using the following link:
https://worker.mturk.com/projects?filters%5Bsearch_term%5D=${searchTerms}

Thanks for participating!
`;

  const WorkerIds = [player.get('participantId')];
  await notifyWorkers({ WorkerIds, Subject, MessageText });
}
