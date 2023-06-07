/* eslint-disable import/prefer-default-export */
import _ from 'lodash';
import { embedInExternalHIT } from './mturk';

export async function createRecruitmentHIT({ game }) {
  const recruitment = game.get('recruitment');
  const timeSlots = game.get('timeSlots');
  const latestTimeSlot = _.map(timeSlots, (timeSlot) => new Date(timeSlot.launchDate))
    .sort()
    .reverse()[0]; // epoch time
  const expiresIn = (latestTimeSlot - Date.now()) / 1000; // seconds
  const totalParticipantsToRecruit = _.sumBy(timeSlots, 'nParticipants');

  console.log(
    `Creating recruitment HIT for ${totalParticipantsToRecruit} participants:`,
    `Reward: ${recruitment.reward}. Expires in ${expiresIn} seconds.`
  );

  embedInExternalHIT({
    Title: recruitment.name,
    Description: recruitment.description,
    Reward: recruitment.reward,
    AssignmentDurationInSeconds: 60 * 60,
    LifetimeInSeconds: expiresIn, // recruitment hit expires when latest time slot launches
    MaxAssignments: totalParticipantsToRecruit,
    RequesterAnnotation: 'Recruitment HIT',
    QualificationRequirements: recruitment.qualificationRequirements,
    iframeURL: process.env.DEPLOY_URL,
  });
}
