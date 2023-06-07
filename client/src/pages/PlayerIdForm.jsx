/*
Can be embedded inside an mturk HIT iframe or used as a standalone page.  
*/

import React, { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Markdown } from "../components/Markdown";
import { H3, P } from "../components/TextStyles";

export function PlayerIdForm({ onPlayerID }) {
  const isEmbedded = window.location !== window.parent.location; // are we in an iframe?
  const isTest = !!window.Cypress; // are we in the test harness iframe?

  const urlParams = new URLSearchParams(window.location.search);
  const paramsObj = Object.fromEntries(urlParams?.entries());
  const paymentIdFromURL = paramsObj?.workerId || undefined;
  const [playerID, setPlayerID] = useState(paymentIdFromURL || "");

  useEffect(() => {
    console.log("Intro: playerId and consent to schedule");
  }, []);

  const handleSubmit = (evt) => {
    evt.preventDefault();
    if (!playerID || playerID.trim() === "") {
      return;
    }
    onPlayerID(playerID);
  };

  const introText = `
## Reserve a Spot for a Mutliplayer Study

In this HIT, you can sign up for a slot in a future multiplayer study. 
You can only sign up for one slot via this signup HIT.

Studies may have specific participant requirements (e.g., webcam usage, trackpad usage).
It is important that you arrive on time to the study.

When your appointment time arrives, you'll receive a reminder email with a link to the game.
You can also choose to recieve reminder emails in advance of the game.

During signup, we'll only collect your MTurk ID and debugging information we need to make sure this scheduler is working properly.

If you have any questions, please feel free to email us at
deliberation-study@wharton.upenn.edu.
`;

  return (
    <div className="grid justify-center">
      <Markdown text={introText} />
      {!paymentIdFromURL && (
        <div>
          <H3>Please enter your MTurk ID</H3>
          <input
            id="playerID"
            name="playerID"
            type="text"
            autoComplete="off"
            required
            className="appearance-none block w-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-empirica-500 focus:border-empirica-500 sm:text-sm"
            value={playerID}
            onChange={(e) => setPlayerID(e.target.value)}
            data-test="inputPaymentId"
          />
        </div>
      )}
      {paymentIdFromURL && (
        <div>
          <H3>MTurk ID: {paymentIdFromURL}</H3>
        </div>
      )}
      <br />
      <div className="w-auto">
        <Button onClick={handleSubmit} testId="joinButton">
          I consent
        </Button>
      </div>
    </div>
  );
}
