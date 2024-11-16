import { Account, CoList, CoMap, Profile, co } from "jazz-tools";

export class JazzProfile extends Profile {
  name = co.string;
  activeRoom = co.ref(Room, { optional: true });
}

export class JazzAccount extends Account {
  profile = co.ref(JazzProfile);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  migrate(this: JazzAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);
  }
}

export class Ballot extends CoMap {
  user = co.ref(JazzAccount);
  voter = co.ref(JazzAccount);
}

export class BallotList extends CoList.Of(co.ref(Ballot)) {}

export class Election extends CoMap {
  winner = co.ref(JazzAccount, { optional: true });
  ballots = co.ref(BallotList, { optional: true });
}

export enum GameStateState {
  Waiting = "waiting",
  RoleAssignment = "role_assignment",
  LocationReveal = "location_reveal",
  Interrogate = "interrogate",
  Vote = "vote",
  ResultWrong = "result_wrong",
  ResultWin = "result_win",
  ResultLose = "result_lose",
}

export class ActiveUsersList extends CoList.Of(co.ref(JazzAccount)) {}
export class KilledUsersList extends CoList.Of(co.ref(JazzAccount)) {}

export class GameState extends CoMap {
  // "waiting" | "role_assignment" | "location_reveal" | "interrogate" | "vote" | "result_wrong" | "result_win" | "result_lose"
  state = co.string;
  location = co.string;
  spy = co.ref(JazzAccount, { optional: true });
  activeUsers = co.ref(ActiveUsersList);
  killedUsers = co.ref(KilledUsersList);
  election = co.ref(Election, { optional: true });
  round = co.number;
}

export class UsersList extends CoList.Of(co.ref(JazzAccount)) {}

export class Room extends CoMap {
  name = co.string;
  users = co.ref(UsersList);

  sessionTime = co.number;
  maxUsers = co.number;

  gameState = co.ref(GameState);
}
