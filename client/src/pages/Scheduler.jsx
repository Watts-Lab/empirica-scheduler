// JSX component for the scheduler page
//
// Shows the participant a list of signup options taken from the batch congig
// and allows them to select one.
// Once they select a batch, they can click a button to add an event to their calendar

import React, { useEffect, useState } from "react";
import { Markdown } from "../components/Markdown";
import {
  usePlayer,
  useGame,
  // usePlayers,
} from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import { Checkbox } from "../components/Checkbox";

const introText = `
# Please select one of the session options below. 
`;

export function Scheduler() {
  const player = usePlayer();
  const game = useGame();
  const timeslots = game?.get("timeSlots");

  const [selected, setSelected] = useState(null);
  const [requirementsMet, setRequirementsMet] = useState(0);

  // compute slots remaining for each timeslot TODO: redo this.
  const slotsRemaining = (timeslot) => {
    return (
      timeslot.nParticipants - (game.get(timeslot.launchDate)?.length || 0)
    );
  };

  const formatDate = (date) => {
    // convert a date string to a local date string
    // e.g. "2021-03-01T16:00:00.000Z" -> "Mon Mar 01 2021 11:00:00 GMT-0500 (Eastern Standard Time)"
    return new Date(date).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZoneName: "short",
    });
  };

  const renderTable = (timeslots) => {
    // display a table where each row is a different timeslot from the timeslot list
    // columns are the timeslot date, and requirements of the timeslot
    // each row has a button labeled "select" to select the timeslot and add it to the player's calendar
    // once a timeslot is selected, the button text changes to "deselect" and the other rows are greyed out
    // players can only sign up for one timeslot
    // The requirements column is a list of requirements for the timeslot that should
    // be displayed as a bulleted list

    return (
      <table className="border-collapse w-full ">
        <tr>
          <th className="border">Session Date</th>
          <th className="border">Session Duration</th>
          <th className="border">Requirements</th>
          <th className="border">Slots remaining</th>
          <th className="border">Select</th>
        </tr>
        {timeslots?.map((timeslot, index) => {
          if (slotsRemaining(timeslot) > 0) {
            return (
              <tr
                className={
                  selected && selected.launchDate === timeslot.launchDate
                    ? "bg-blue-100"
                    : ""
                }
              >
                <td className="border text-center">
                  {formatDate(timeslot.launchDate)}
                </td>
                <td className="border text-center">
                  {timeslot.duration} Minutes
                </td>
                <td className="border">
                  <ul>
                    {timeslot.requirements?.map((req) => (
                      <li className="list-disc ml-6">{req}</li>
                    ))}
                  </ul>
                </td>
                <td className="border text-center">
                  {slotsRemaining(timeslot)}
                </td>
                <td className="border text-center">
                  <Button
                    disabled={
                      selected && selected.launchDate !== timeslot.launchDate
                    }
                    onClick={() => {
                      if (
                        selected &&
                        selected.launchDate === timeslot.launchDate
                      ) {
                        setSelected(null);
                      } else {
                        setSelected(timeslot);
                      }
                    }}
                  >
                    {selected && selected.launchDate === timeslot.launchDate
                      ? "Unselect"
                      : "Select"}
                  </Button>
                </td>
              </tr>
            );
          }
        })}
      </table>
    );
  };

  const renderCheckRequirements = () => (
    <div className="my-3">
      Please confirm that you will be able to meet the following requirements at
      your selected session time:
      {selected.requirements?.map((req, index) => (
        <Checkbox name={req} label={req} />
      ))}
    </div>
  );

  const renderNotificationOptions = () => {
    return (
      <div class="mt-8">
        <p>Please select any email reminders you would like for this session</p>
        <Checkbox
          name="24hr reminder"
          label="1 day in advance"
          onChange={(checked) => player.set("remind24hr", checked)}
        />
        <Checkbox
          name="1hr reminder"
          label="1 hour in advance"
          onChange={(checked) => player.set("remind1hr", checked)}
        />
        <Checkbox
          name="15min reminder"
          label="15 minutes in advance"
          checked
          onChange={(checked) => player.set("remind15min", checked)}
        />
      </div>
    );
  };

  return (
    <div className="my-8 ml-10 mr-10">
      <Markdown text={introText} />
      {renderTable(timeslots)}
      {selected && renderCheckRequirements()}
      {selected && renderNotificationOptions()}

      <div className="flex justify-center">
        <Button
          disabled={!selected}
          onClick={() => {
            player.set("timeSlot", selected);
            player.set(
              "timeZone",
              Intl.DateTimeFormat().resolvedOptions().timeZone
            );
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
