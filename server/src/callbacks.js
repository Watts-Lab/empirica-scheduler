import { ClassicListenersCollector } from '@empirica/core/admin/classic';
import _ from 'lodash';
import {
  createQualificationType,
  assignQualificationToWorker,
  destroyQualificationType,
} from './mturk';
import { scheduleReminder, sendConfirmationEmail } from './reminders';
import { createRecruitmentHIT } from './recruit';
import { deregisterTimersMatching } from './timers';
import { scheduleStudyLaunch } from './launch';

export const Empirica = new ClassicListenersCollector();

// const recruitmentHITs = new Map();
const batchOrder = [];

// ------------- Batch callbacks -------------
// on batch creation
Empirica.on('batch', async (ctx, { batch }) => {
  if (!batch.get('initialized')) {
    // todo: validate config
    // const { config } = batch.get('config');

    batch.set('lobbyConfig', {
      kind: 'shared',
      duration: 5000000000,
      strategy: 'ignore',
    });
  }
});

// on batch start
Empirica.on('batch', 'status', (ctx, { batch, status }) => {
  if (status !== 'running') return;
  if (batch.get('gameSetup')) return; // don't start game if already started
  batch.set('gameSetup', true); // for now, assume that the batch setup succeeds

  // Pushing the details of what actually happens during the single-game batch
  // down to the game level, and using the batch callbacks to manage the batches
  // themselves and the assignment of players to games.

  const { config } = batch.get('config');
  const game = batch.addGame([
    { key: 'treatment', value: { playerCount: 1 } },
    {
      key: 'timeSlots',
      value: config.timeSlots,
      immutable: true,
    },
    {
      key: 'recruitment',
      value: config.recruitment,
      immutable: true,
    },
  ]);

  // Currently, we aren't able to get things from the game object
  // to the client, so we have to use the globals object in the meantime.
  // see: https://github.com/empiricaly/empirica/issues/313
  // when this is fixed, we can remove the following lines.
  ctx.globals.set('timeSlots', config.timeSlots);

  // game.start(); // not sure why this doesn't work
  game.set('start', true);

  ctx.globals.set('gameOpen', true);
  batchOrder.push(batch); // add to list in order batches were started
  batch.set('gameSetup', true);
});

// on batch end
Empirica.on('batch', 'status', (ctx, { batch, status }) => {
  if (!(status === 'terminated' || status === 'failed' || status === 'ended')) return;

  // end game
  const game = batch.games[0];
  game.end(status);

  // remove batch from batchOrder
  for (let i = 0; i < batchOrder.length; i++) {
    if (batchOrder[i].id === batch.id) {
      batchOrder.splice(i, 1);
      console.log('batch removed from batchOrder: ', batch.id);
      break;
    }
  }
  // if no more batches, set flag to display noGames page
  if (batchOrder.length === 0) {
    ctx.globals.set('gameOpen', false);
    console.log('No games available');
  }
});

// --------------- Game callbacks ----------------

async function setupTimeSlot({ game, timeSlot }) {
  console.log('Initializing time slot', timeSlot);

  // schedule timers. these need to be reinitialized on server restart
  scheduleReminder({
    game,
    timeSlot,
    reminderName: 'remind24hr',
    offset: 24 * 60,
  });

  scheduleReminder({
    game,
    timeSlot,
    reminderName: 'remind1hr',
    offset: 60,
  });

  scheduleStudyLaunch({ game, timeSlot });

  // create the qualification type if it doesn't already exist
  const { launchDate } = timeSlot;
  const qualificationTypes = game.get('qualificationTypes') || {};
  console.log('qualificationTypes', qualificationTypes);
  if (launchDate in qualificationTypes) {
    return [launchDate, qualificationTypes[launchDate]];
  }
  console.log('Creating qualification type for timeSlot', timeSlot.launchDate);
  const shortDate = new Date(launchDate).toISOString().replace(/[-:]/g, '');
  const newQualificationType = await createQualificationType({
    Name: `${shortDate} appointment created by ${game.id}`, // must be unique to the game and timeSlot
    Description: `Worker signed up to participate in a multiplayer HIT at ${launchDate}`,
  });
  return [launchDate, newQualificationType];
}

Empirica.on('game', 'start', async (ctx, { game, start }) => {
  if (!start) return;
  if (game.get('intialized')) return; // don't start game if already started
  game.set('intialized', true); // for now, assume that the game setup succeeds

  console.log('GAME STARTED', game.id);

  // Ideally, we wouldn't need to mess with rounds and stages, but there's this bug, you see...
  game.set('roundIndex', -1); // there is a problem here somewhere...
  const round = game.addRound({ name: 'main' });
  round.addStage({ name: 'mainStage', duration: 1000 });

  // set up the timeSlots

  const qualificationTypes = Object.fromEntries(
    await Promise.all(game.get('timeSlots').map((timeSlot) => setupTimeSlot({ game, timeSlot })))
  );
  console.log('Setting qualification types to', qualificationTypes);
  game.set('qualificationTypes', qualificationTypes);

  // create the recruitment HIT if it doesn't already exist
  if (!game.get('recruitmentHITCreated')) {
    createRecruitmentHIT({ game });
    game.set('recruitmentHITCreated', true);
  }
});

Empirica.onGameEnded(async ({ game }) => {
  // deregister timers for reminders and study launch
  deregisterTimersMatching({ substring: game.id });

  // destroy the qualification types created for the game
  await Promise.all(
    game.get('qualificationTypes').map((qualificationType) => {
      const { QualificationTypeId } = qualificationType;
      return destroyQualificationType({ QualificationTypeId });
    })
  );

  // Todo: send cancellation email if necessary
  // Todo: retire players in the batch, so they can sign up for other appointments later on
  // Todo: if necessary, take down the recruitment HIT
});

// ---------------- Player callbacks ----------------
Empirica.on('player', async (ctx, { player }) => {
  console.log(`Player ${player.get('participantIdentifier')} Joined`);

  // assign to the game of the most senior batch still accepting players
  // todo: in the future, accept a URL parameter to assign players to a specific batch
  // eslint-disable-next-line no-restricted-syntax
  for (const batch of batchOrder) {
    if (batch.get('status') === 'running' && !batch.get('full')) {
      const game = batch.games[0];
      console.log('game', game.id);

      game.assignPlayer(player);
      player.set('treatment', { playerCount: 1 }); // not sure why this is required
      player.set('gameID', game.id);
      console.log(`player ${player.get('participantID')} added to game ${player?.currentGame?.id}`);
      break;
    }
  }
});

Empirica.on('player', 'timeSlot', (ctx, { player, timeSlot }) => {
  if (!timeSlot) return;
  console.log('player', player.get('participantIdentifier'), 'signed up for timeSlot', timeSlot);

  const game = player.currentGame;
  const players = game.players.filter((p) => p.get('timeSlot') === timeSlot.launchDate);

  // assign to smallest unfilled group
  // if all current groups are full, assign to a new group
  const groupAssignments = players.map((p) => p.get('groupAssignment'));
  const groupCounts = _.countBy(groupAssignments);
  const smallestGroupIndex = _.minBy(Object.keys(groupCounts), (group) => groupCounts[group]);
  const groupIndex =
    groupCounts[smallestGroupIndex] >= 9 ? _.max(groupAssignments) + 1 : smallestGroupIndex;
  player.set('groupAssignment', groupIndex);

  // assign worker a qualification where the IntegerValue is their assigned group index
  const qualificationTypes = game.get('qualificationTypes');
  const playerQualificationToAssign = qualificationTypes[timeSlot.launchDate];
  assignQualificationToWorker({
    WorkerId: player.get('participantIdentifier'),
    QualificationTypeId: playerQualificationToAssign.QualificationTypeId,
    IntegerValue: groupIndex,
  });

  sendConfirmationEmail({ player, timeSlot });

  // Todo: check if all the slots in the batch have been assigned,
  // so that we can show a message to players that the batch is full

  // this is here because of the issue with game object not being available on client
  // when that's fixed, this stuff should be saved to the game object from the client side,
  // and not the globals object
  // const priorSignups = ctx.globals.get(timeSlot.launchDate) || [];
  // ctx.globals.set(timeSlot.launchDate, [...priorSignups, player.get('participantIdentifier')]);
});
