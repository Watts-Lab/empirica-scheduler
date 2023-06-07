import React from "react";
import { Scheduler } from "./Scheduler";
import { Confirmation } from "./Confirmation";
import { StudyLink } from "./StudyLink";
import { usePlayer } from "@empirica/core/player/classic/react";
import logo from "/penn_css_logo.png";

export function Game() {
  const player = usePlayer();
  const timeSlot = player.get("timeSlot");
  // const studyLaunched = player.get("studyLaunched");
  const studyLaunched = Date.parse(timeSlot?.launchDate) < Date.now();

  return (
    <div className="ml-10 mr-10 mt-8">
      <div>
        <img src={logo} width="250" />
      </div>
      {!timeSlot && !studyLaunched && <Scheduler />}
      {timeSlot && !studyLaunched && <Confirmation />}
      {studyLaunched && <StudyLink />}
    </div>
  );
}
