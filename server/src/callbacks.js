import { ClassicListenersCollector } from "@empirica/core/admin/classic";
export const Empirica = new ClassicListenersCollector();

var batchOrder = [];

// on batch creation
Empirica.on("batch", async (ctx, { batch }) => {
  if (!batch.get("initialized")) {
    const { config } = batch.get("config");
    batch.set("lobbyConfig", {
      kind: "shared",
      duration: 5000000000, // 5 seconds
      strategy: "ignore",
    });
  }
});

// on batch start
Empirica.on("batch", "status", (ctx, { batch, status }) => {
  if (status !== "running") return;
  if (batch.get("gameSetup")) return; // don't start game if already started

  const { config } = batch.get("config");
  const game = batch.addGame([
    { key: "treatment", value: { playerCount: 5 } },
    {
      key: "timeSlots",
      value: config.timeSlots,
      immutable: true,
    },
  ]);

  //game.start();  // not sure why this doesn't work
  game.set("start", true);
  ctx.globals.set("gameOpen", true);
  batch.set("gameSetup", true);
  batchOrder.push(batch); // add to list in order batches were started
});

// on batch end
Empirica.on("batch", "status", (ctx, { batch, status }) => {
  if (!(status === "terminated" || status === "failed" || status === "ended"))
    return;

  // end game
  const game = batch.games[0];
  game.end(status);

  // remove batch from batchOrder
  for (let i = 0; i < batchOrder.length; i++) {
    if (batchOrder[i].id === batch.id) {
      batchOrder.splice(i, 1);
      console.log("batch removed from batchOrder: ", batch.id);
      break;
    }
  }
  // if no more batches, set flag to display noGames page
  if (batchOrder.length === 0) {
    ctx.globals.set("gameOpen", false);
    console.log("No games available");
  }
});

// on player join
Empirica.on("player", async (ctx, { player }) => {
  console.log(`Player ${player.get("participantID")} arrived`);

  // assign to the game of the most senior batch still accepting players
  for (batch of batchOrder) {
    if (batch.get("status") === "running" && !batch.get("full")) {
      const game = batch.games[0];
      console.log("game", game.id);

      game.assignPlayer(player);
      player.set("treatment", { playerCount: 5 });
      console.log(
        `player ${player.get("participantID")} added to game ${
          player?.currentGame?.id
        }`
      );
      break;
    }
  }
});

Empirica.onGameStart(({ game }) => {
  console.log("GAME STARTED", game.id);
});
