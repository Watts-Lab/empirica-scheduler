// JSX component for the study link page
// Shown to participants when they accept the study HIT,
// Provides a link to the study and a box to enter their completion code

import React, { useState } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import { Markdown } from "../components/Markdown";

const text = `
# The study you signed up for is now live!
**Make sure to leave this window open as you complete the study.**

You will return to this window after the study, and past a code into the box below.
`;

export function StudyLink() {
  const player = usePlayer();
  const [completionCode, setCompletionCode] = useState(null);
  const timeSlot = player.get("timeSlot");
  const fullURL = `${timeSlot?.studyUrl}${window.location.search}`;
  const urlParams = new URLSearchParams(window.location.search);
  const assignmentId = urlParams.get("assignmentId");

  const renderCompletionCodeInput = () => {
    // display a text entry box for the participant to enter their completion code
    // beside the text entry box, display a button that will submit the completion code
    // and complete the HIT

    const handleSubmit = (event) => {
      event.preventDefault();
      player.set("completionCode", completionCode);
      event.target.form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    };

    return (
      <div className="mt-8">
        <p>
          <strong>Enter your completion code here:</strong>
        </p>
        <form action={submitURL} method="POST" id="mturk_form">
          <input
            className="appearance-none mr-3 w-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-empirica-500 focus:border-empirica-500 sm:text-sm"
            type="text"
            onChange={(e) => setCompletionCode(e.target.value)}
            name="completionCode"
          />
          <input
            type="hidden"
            id="assignmentId"
            name="assignmentId"
            value={assignmentId}
          />
          <Button handleClick={handleSubmit}>Submit</Button>
        </form>
      </div>
    );
  };

  const renderStudyLink = () => {
    return (
      <div className="mt-8">
        <a target="_blank" href={fullURL}>
          <h2 className="text-xl text-blue-600 font-bold font-mono underline">
            Click here to start the study
          </h2>
        </a>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <Markdown text={text} />
      {renderStudyLink()}
      {renderCompletionCodeInput()}
    </div>
  );
}
