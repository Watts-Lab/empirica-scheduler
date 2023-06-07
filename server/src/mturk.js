/* eslint-disable max-len */
// launch HITs on Amazon Mechanical Turk
// docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-mturk/
// better docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/preview/client/mturk/
//
import {
  MTurkClient,
  CreateQualificationTypeCommand,
  AssociateQualificationWithWorkerCommand,
  ListWorkersWithQualificationTypeCommand,
  DeleteQualificationTypeCommand,
  CreateHITCommand,
} from '@aws-sdk/client-mturk';
import assert from 'assert';

const endpoint = 'https://mturk-requester-sandbox.us-east-1.amazonaws.com';
// const endpoint = "https://mturk-requester.us-east-1.amazonaws.com";

const client = new MTurkClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MTURK_ACCESS_KEY_ID,
    secretAccessKey: process.env.MTURK_SECRET_ACCESS_KEY,
  },
  endpoint,
});

export async function createQualificationType({ Name, Description }) {
  try {
    const response = await client.send(
      new CreateQualificationTypeCommand({
        Name,
        Description,
        QualificationTypeStatus: 'Active',
      })
    );
    assert(response.QualificationType.QualificationTypeId);
    return response.QualificationType;
  } catch (err) {
    console.log(`Error creating qualification type ${Name}`, err);
    return null;
  }
}

export async function assignQualificationToWorker({
  QualificationTypeId,
  WorkerId,
  IntegerValue,
  SendNotification,
}) {
  try {
    await client.send(
      new AssociateQualificationWithWorkerCommand({
        QualificationTypeId,
        WorkerId,
        IntegerValue,
        SendNotification: SendNotification || false,
      })
    );
  } catch (err) {
    console.log(`Error assigning qualification ${QualificationTypeId} to worker ${WorkerId}`, err);
  }
}

export async function getWorkersWithQualification({ QualificationTypeId }) {
  // returns an array of qualification objects
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/preview/Package/-aws-sdk-client-mturk/Interface/Qualification/
  // returns:
  // qualification_object = {
  //  WorkerId: STRING,
  //  QualificationTypeId: STRING,
  //  GrantTime: DATE
  //  IntegerValue: INTEGER,
  //  LocaleValue: {
  //    Country: STRING,
  //    Subdivision: STRING
  //  }
  //  Status: "Granted" | "Revoked"
  // }

  const numResultsRequested = 100; // not sure what the limit is

  const requestArgs = {
    QualificationTypeId,
    MaxResults: numResultsRequested,
  };

  // get paginated results and concatenate them
  let qualifications = [];
  let numResultsReturned = 0;
  do {
    // eslint-disable-next-line no-await-in-loop
    const result = await client.send(new ListWorkersWithQualificationTypeCommand(requestArgs));
    requestArgs.NextToken = result.NextToken;
    numResultsReturned = result.NumResults;
    qualifications = qualifications.concat(result.Qualifications);
  } while (numResultsReturned === numResultsRequested);

  return qualifications;
}

export async function destroyQualificationType({ QualificationTypeId }) {
  const response = await client.send(new DeleteQualificationTypeCommand({ QualificationTypeId }));
  return response;
}

export async function embedInExternalHIT({
  Title,
  Description,
  Reward,
  AssignmentDurationInSeconds, // how long participants have to complete the HIT
  LifetimeInSeconds, // how long the HIT is available on MTurk
  MaxAssignments,
  RequesterAnnotation,
  QualificationRequirements,
  iframeURL,
}) {
  // Creates an ExternalQuestion HIT with an iframe to the survey
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/preview/client/mturk/command/CreateHITCommand/
  // https://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_ExternalQuestionArticle.html

  // xml declaration must be absolutely the first thing in the string, otherwise wont parse
  const externalQuestionXML = `<?xml version="1.0" encoding="UTF-8"?>
  <ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd">
    <ExternalURL>${iframeURL}</ExternalURL>
    <FrameHeight>0</FrameHeight>
  </ExternalQuestion>
`;
  console.log('externalQuestionXML', externalQuestionXML);

  const params = {
    Title,
    Description,
    Reward: Reward.toString(),
    Question: externalQuestionXML,
    AssignmentDurationInSeconds: Number.parseInt(AssignmentDurationInSeconds, 10),
    LifetimeInSeconds: Number.parseInt(LifetimeInSeconds, 10),
    MaxAssignments: Number.parseInt(MaxAssignments, 10),
    RequesterAnnotation,
    QualificationRequirements,
  };

  const response = await client.send(new CreateHITCommand(params));

  return response.HIT;
}

export async function notifyWorkers({ WorkerIds, Subject, MessageText }) {
  console.log('notifying workers', WorkerIds, Subject, MessageText);
}
