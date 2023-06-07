// JSX component for the confirmation page
//
// Displays after a participant has signed up for a particular session.
// Displays the signup options for the session they have signed up for.
// Allows them to add the session to their calendar.
// Allows them to select which email reminders they want to receive.
// Allows them to cancel their participation in the batch.
// Shows a confirmation code for the signup process after they have confirmed their reminders.

import React from "react";
import { Button } from "../components/Button";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Markdown } from "../components/Markdown";
import { GCalButton } from "../components/GCalButton";

// const submitURL = "https://www.mturk.com/mturk/externalSubmit";
const submitURL = "https://workersandbox.mturk.com/mturk/externalSubmit";

const text = `
# Thank you for signing up for a session!
Your session details are below:

`;

export function Confirmation() {
  const player = usePlayer();
  const timeSlot = player.get("timeSlot");
  const displaySubmitButton = !player.get("signupHitSubmitted");
  const urlParams = new URLSearchParams(window.location.search);
  const assignmentId = urlParams.get("assignmentId");

  const time = new Date(timeSlot.launchDate).toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZoneName: "short",
  });
  const date = new Date(timeSlot.launchDate).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const requirements = (
    <ul>
      {timeSlot.requirements?.map((req) => (
        <li className="list-disc ml-4">{req}</li>
      ))}
    </ul>
  );

  // Todo: submit the form to complete the mturk HIT we are embedded in

  const renderSessionDetails = () => {
    return (
      <div class="mt-8">
        <p>
          Session date: <strong>{date}</strong>
        </p>
        <p>
          Session time: <strong>{time}</strong>
        </p>
        <p>
          Session duration: <strong>{timeSlot.duration} Minutes</strong>
        </p>
        <br />
        <p>Session requirements: {requirements} </p>
      </div>
    );
  };

  const renderCalendarButtons = () => {
    return (
      <div>
        <GCalButton
          title={timeSlot.name}
          description={timeSlot.description}
          start={timeSlot.launchDate}
          duration={timeSlot.duration}
        />
      </div>
    );
  };

  const renderSubmitButton = () => {
    const handleSubmit = (event) => {
      event.preventDefault();
      player.set("signupHitSubmitted", true);
      event.target.form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    };

    return (
      <div className="flex justify-center">
        <form id="mturk_form" method="post" action={submitURL}>
          <input
            type="hidden"
            id="assignmentId"
            name="assignmentId"
            value={assignmentId}
          />
          <Button onClick={handleSubmit}>Submit HIT</Button>
        </form>
      </div>
    );
  };

  const renderWaitMessage = () => (
    <div className="flex justify-center">
      <p className="text-xl text-gray-600 font-bold font-mono">
        Please wait, your session will begin shortly.
      </p>
      <p>
        When your session goes live, this page will automatically update with
        your session details.
      </p>
    </div>
  );

  return (
    <div className="my-8 ">
      <Markdown text={text} />

      {renderSessionDetails()}
      {displaySubmitButton && renderCalendarButtons()}
      {displaySubmitButton && renderSubmitButton()}

      {!displaySubmitButton && renderWaitMessage()}
    </div>
  );
}
