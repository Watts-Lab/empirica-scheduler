## Custom batch json

Qualification requirements: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/preview/Package/-aws-sdk-client-mturk/Interface/QualificationRequirement/

```json
{
  "recruitment": {
    "name": "Sign up for a multiplayer video discussion study",
    "description": "Qualification and signup HIT for future studies over the next week",
    "reward": 0.1,
    "qualificationRequirements": []
  },

  "timeSlots": [
    {
      "name": "Video Discussion Study",
      "description": "Join other study participants in a videocall discussion about an assigned topic.",
      "launchDate": "06 June 2023 21:00:00 EDT",
      "studyUrl": "https://study.deliberation-lab.org",
      "nParticipants": 100,
      "duration": 45,
      "reward": 6.25,
      "requirements": [
        "webcam",
        "microphone",
        "headphones",
        "quiet room with no interruptions",
        "able to join a videocall discussion with other participants"
      ]
    },
    {
      "name": "Video Discussion Study",
      "description": "Join other study participants in a videocall discussion about an assigned topic.",
      "launchDate": "07 June 2023 13:00:00 EDT",
      "studyUrl": "https://study.deliberation-lab.org",
      "nParticipants": 1,
      "duration": 45,
      "reward": 6.25,
      "requirements": [
        "webcam",
        "microphone",
        "headphones",
        "quiet room with no interruptions",
        "able to join a videocall discussion with other participants"
      ]
    }
  ]
}
```

# Environment Variables

```
MTURK_REQUESTER_NAME =
```

# Config validation

1. `name` is the HIT title that will be eventually displayed for the Study HIT. It is also displayed in the row on the signup page.
2. `description` is the HIT description displayed in the evential Study HIT.
3. `duration` is the expected time to complete the HIT assuming participants start at the same time
4. `studyURL` starts with `https://` or `http://`
5. within a batch, each timeslot must have a unique `launchDate`
6. the study url should resolve
7. The number of participants in timeSlot should be less than 900

State is essentially stored in three places:

1. In the global/batch/game/player objects
2. In the server working memory
3. On the mturk server

(1) and (3) are persistent once set and changed, but (2) might be cleared
if the server restarts itself for some reason, so need to check that
we are creating things once that want to be created once, and recreating
anything that is lost on server refresh.

# Callbacks

## On batch creation

- [ ] Check that the config is valid
- [ ] Estimate and log the total cost
- [ ] Check that the required environment variables are set

## On batch start

- [x] Create a game
- [x] Add batch to the queue to wait for participants
- [x] Update (if necessary) the `gameOpen` flag that controls the participant noBatches display

## On batch end

- [x] stop the game
- [x] take the batch out of the queue to
- [x] Update (if necessary) the `gameOpen` flag that controls the participant noBatches display

## On game start

- [x] create an `External Question` style HIT and embed this page in it.

#### for each timeslot

- [x] create a qualification
- [x] set up timers to send reminders
- [x] set up timer to launch study HITs and send study HIT URL to participants
- [x] set up a unique MTurk qualification for players joining that slot

## On game ended

- [x] destroy qualification for each timeslot
- [x] deregister any game timers (reminders, launch)
- [ ] if the study hasn't occurred yet, send a cancellation email to those that signed up
- [ ] if necessary take down the signup HIT

## On player

- [x] assign to next open batch and game
- [ ] use a url param to direct participants to a specifc batch

## On player selects timeSlot

- [x] Identify which qualification value to assign the player
- [x] Assign the qualification value to the player
- [x] Send player a confirmation email
- [ ] Check if the batch is full, and if so, set the flag to direct participants to the next one, and take down the signup HIT.
- [ ] Send a confirmation notification to the participant
- [ ] confirmation email has links to add to calendar
- [ ] Approve payment for recruitment HIT

# Timers

## 24 hr prior

- [x] send notification reminders to those who asked for them

## 1 hr prior

- [x] send notification reminder to those who asked for them

## 15 minute prior

- [ ] create study HITs with the appropriate qualifications
- [ ] get a link to the various study HITs (could use something like : `https://workersandbox.mturk.com/projects?filters%5Bsearch_term%5D=watts-lab+search+term`)
- [ ] send notifications with the link to the HIT, along with directions for finding it (these have the timestamp)
- [ ] if this is the last timeSlot in the batch, set the batch to full, or no longer accepting participants, and remove the recruitment HIT listing

## At study launch

- [x] for those who signed up for the current timeslot, change the display to show the study link page

# Client side pages

## PlayerIdForm

We can't show players the signup until we know what they qualify for,
which means we need to know who they are. In preview mode, the embedded iframe
gets the following url parameters:
`?assignmentId=ASSIGNMENT_ID_NOT_AVAILABLE&amp;hitId=37Y5122M6EFXFCQSXH`
which doesn't include the workerId, so we need to wait until the players have
accepted the HIT before we can show them anything...

## "Scheduler"

- [ ] display a row for each timeSlot in the batch
- [ ] don't display rows that have no slots left
- [ ] when a player selects a row, disable the others
- [ ] when a player selects a row, show them the qualification requirements, and have them confirm that they can meet all of them.
- [ ] after that, allow them to sign up.

## "Confirmation" Page

- [ ]

- [ ] submits the HIT to MTurk

## On submission of

Note:

- when a player submits a HIT, it closes and loads the next HIT for them
