import _ from 'lodash';
import { embedInExternalHIT, getWorkersWithQualification, notifyWorkers } from './mturk';
import { registerTimer } from './timers';
import { localizeDateTime } from './utils';

async function notifyTimeZoneLaunch({ WorkerIds, timeZone, timeSlot }) {
  // notify workers that the HIT is available with a link to the HIT
  const { time, date } = localizeDateTime({
    dateTime: timeSlot.launchDate,
    timeZone,
  });

  const fmtHit = timeSlot.name.replace(/ /g, '+');
  const fmtRequester = process.env.MTURK_REQUESTER_NAME.replace(/ /g, '+');
  const searchTerms = encodeURIComponent(`${fmtHit}+${fmtRequester}`);

  const Subject = `Multiplayer HIT available: ${timeSlot.name}`;
  const MessageText = `
The multi-participant HIT you signed up for begins shortly:

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

  notifyWorkers({ WorkerIds, Subject, MessageText });
}

export async function notifyHITLaunch({ players, timeSlot }) {
  // notify workers that the HIT is available with a link to the HIT

  const playersByTimeZone = _.groupBy(players, (player) => player.get('timeZone'));
  Object.entries(playersByTimeZone).forEach(([timeZone, groupPlayers]) => {
    const WorkerIds = groupPlayers.map((player) => player.get('participantID'));
    notifyTimeZoneLaunch({ WorkerIds, timeZone, timeSlot });
  });
}

async function launchStudyHIT({ game, timeSlot }) {
  // Launch a study HIT for the given timeSlot

  // Get the qualification assignments for this time slot from MTurk itself,
  // so that we are working with the ground truth qualifications
  const QualificationTypeId = game.get('qualificationTypes')[timeSlot.launchDate];
  const qualifications = await getWorkersWithQualification({
    QualificationTypeId,
  });

  const workerGroups = _.groupBy(qualifications, 'IntegerValue');

  console.log(
    `Launching ${workerGroups} Study HITs for ${qualifications.length} workers at ${timeSlot.launchDate}`
  );

  const hitList = [];
  Object.entries(workerGroups).forEach(([groupNumber, group]) => {
    if (group.length > 9) {
      console.log(
        `Group ${groupNumber} has ${group.length} players, expected <= 9. Running anyways.`
      );
    }
    const WorkerIds = _.map(group, 'WorkerId');
    const players = game.players.filter((player) =>
      WorkerIds.includes(player.get('participantID'))
    );

    // Todo: Check that the qualification assignments are what we expect them to be

    const HIT = embedInExternalHIT({
      Title: timeSlot.name,
      Description: timeSlot.description,
      Reward: timeSlot.reward,
      AssignmentDurationInSeconds: timeSlot.duration * 4 * 60, // default margin of 4x to allow completion and submission.
      LifetimeInSeconds: 15 * 60, // 15 minutes
      MaxAssignments: group.length, // one for each worker in the group
      RequesterAnnotation: 'Study HIT',
      QualificationRequirements: [
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/preview/Package/-aws-sdk-client-mturk/Interface/QualificationRequirement/
        {
          QualificationTypeId,
          Comparator: 'EqualTo',
          IntegerValues: [groupNumber],
          ActionsGuarded: 'DiscoverPreviewAndAccept',
        },
      ],
      iframeURL: process.env.DEPLOY_URL,
    });
    hitList.push(HIT);

    notifyHITLaunch({ players, timeSlot });
  });

  const allHits = game.get('studyHITs') || {};
  allHits[timeSlot.launchDate] = hitList;
  game.set('studyHITs', allHits); // not sure if this will work because of https://github.com/empiricaly/empirica/issues/266
}

// function releaseStudyLinkPage({ game, timeSlot }) {
//   // tell player's front-end to display the study link
//   const players = game.players.filter(
//     (player) => player.get('timeSlot').launchDate === timeSlot.launchDate
//   );
//   players.forEach((player) => player.set('studyLaunched', true));
// }

export async function scheduleStudyLaunch({ game, timeSlot }) {
  // schedule the launch of the study HITs
  // set up a timer to launch the study HITs at `offset` minutes before the launch date

  const { launchDate } = timeSlot;

  registerTimer({
    timerName: `launchHITs_${launchDate}_${game.id}`,
    launchDate,
    callback: () => launchStudyHIT({ game, timeSlot }),
    offset: 15,
  });

  // this won't work because we can't set attributes to the player in a timer callback
  // see https://github.com/empiricaly/empirica/issues/266
  // registerTimer({
  //   name: `releaseStudyLinkPage_${launchDate}_${game.id}`,
  //   launchDate,
  //   callback: () => releaseStudyLinkPage({ game, timeSlot }),
  //   offset: 0,
  // });
}
