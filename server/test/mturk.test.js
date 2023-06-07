import { createSurveyLinkHit } from "../src/mturk";
// const { createSurveyLinkHit } = require("../src/mturk");

test("createSurveyLinkHit", async () => {
  const hit = await createSurveyLinkHit({
    Title: "test",
    Description: "test",
    Reward: "0.01",
    AssignmentDurationInSeconds: 60 * 60,
    LifetimeInSeconds: 60 * 60,
    MaxAssignments: 1,
    RequesterAnnotation: "test",
    QualificationRequirements: [],
    studyURL: "https://google.com",
  });
  console.log(hit);
  expect(hit).toBeDefined();
});
