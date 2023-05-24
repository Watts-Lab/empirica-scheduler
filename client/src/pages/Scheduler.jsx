// JSX component for the scheduler page
//
// Shows the participant a list of signup options taken from the batch congig
// and allows them to select one.
// Once they select a batch, they can click a button to add an event to their calendar

import React, { useEffect, useState } from "react";
import { Markdown } from "../components/Markdown";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";

const introText = `
Please select one of the options below. 
`;

export function Scheduler() {
  const player = usePlayer();
  console.log("player", player);
  const game = useGame();
  console.log("game", game);
  const timeslots = game?.get("timeSlots");

  const gameFromPlayer = player?.currentGame;
  console.log("gameFromPlayer", gameFromPlayer);

  console.log("player gameID", player?.get("gameID"));

  return (
    <div>
      <Markdown text={introText} />
      {timeslots?.map((timeslot) => (
        <div>
          <div>{timeslot.name}</div>
          <div>{timeslot.launchDate}</div>
          <div>{timeslot.requirements}</div>
        </div>
      ))}
    </div>
  );
}
