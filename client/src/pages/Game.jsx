import React from "react";
import { Scheduler } from "./Scheduler";
import { Confirmation } from "./Confirmation";
import { usePlayer } from "@empirica/core/player/classic/react";

export function Game() {
  const player = usePlayer();
  return (
    <div>
      Hello!
      {player.get("booked") ? <Confirmation /> : <Scheduler />}
    </div>
  );
}
