import { EmpiricaClassic } from "@empirica/core/player/classic";
import { EmpiricaContext } from "@empirica/core/player/classic/react";
import {
  EmpiricaMenu,
  EmpiricaParticipant,
  useGlobal,
} from "@empirica/core/player/react";
import React from "react";
import { PlayerIdForm } from "./pages/PlayerIdForm";
import { Game } from "./pages/Game";
import { NoGames } from "./pages/NoGames";

function InnerContext() {
  const globals = useGlobal();
  if (!globals) return "Loading...";
  if (!globals.get("gameOpen")) return <NoGames />;

  return (
    <div className="h-full overflow-auto">
      <EmpiricaContext
        disableConsent
        playerCreate={PlayerIdForm}
        disableNoGames
        unmanagedAssignment
      >
        <Game />
      </EmpiricaContext>
    </div>
  );
}

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerKey = urlParams.get("participantKey") || "";

  const { protocol, host } = window.location;
  const url = `${protocol}//${host}/query`;

  return (
    <EmpiricaParticipant url={url} ns={playerKey} modeFunc={EmpiricaClassic}>
      <div className="h-screen relative">
        <EmpiricaMenu position="bottom-left" />
        <InnerContext />
      </div>
    </EmpiricaParticipant>
  );
}
