"use client";

import type { ID } from "jazz-tools";
import { Group } from "jazz-tools";

import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useAccount, useCoState } from "@/lib/jazz";
import {
  ActiveUsersList,
  GameStateState,
  JazzAccount,
  Room,
} from "@/lib/jazz/schema";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: pageId } = use(params);
  const { me } = useAccount();
  const router = useRouter();
  const room = useCoState(Room, pageId as ID<Room>);
  const loading = useRef(0);

  useEffect(() => {
    if (loading.current < 1) {
      loading.current++;
    }
  }, []);

  // TODO: kick people out of the room if they are not in the room
  // useEffect(
  //   () =>
  //     Room.subscribe(pageId as ID<Room>, me, [], (room) => {
  //       if (!room.users!.map((v) => v!.id).includes(me.id)) {
  //         router.push("/");
  //       }
  //     }),
  //   [pageId, me],
  // );

  if (loading.current === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  if (!room) return;

  const joinRoom = () => {
    const roomSize = room.users!.length || 10;
    if (roomSize + 1 > room?.maxUsers) {
      return;
    }

    room.users!.push(me);
    me.profile!.activeRoom = room;
    router.refresh();
  };

  if (!room?.users?.map((v) => v?.id).includes(me.id)) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <h1 className="text-2xl font-bold">Join {room?.name}?</h1>
        <Button onClick={() => joinRoom()}>Join</Button>
      </div>
    );
  }

  const roomGroup = room._owner as Group;
  const isAdmin = roomGroup.members.some(
    (v) => v.id === me.id && v.role === "admin",
  );

  if (room.gameState?.state === GameStateState.Waiting) {
    return <WaitingScreen room={room} isAdmin={isAdmin} />;
  }

  if (room.gameState?.state === GameStateState.RoleAssignment) {
    return <RoleAssignmentScreen room={room} me={me} isAdmin={isAdmin} />;
  }

  if (room.gameState?.state === GameStateState.LocationReveal) {
    return <LocationRevealScreen room={room} me={me} isAdmin={isAdmin} />;
  }

  if (room.gameState?.state === GameStateState.Interrogate) {
    return <InterrogateScreen room={room} me={me} isAdmin={isAdmin} />;
  }

  if (room.gameState?.state === GameStateState.Vote) {
    return <VoteScreen room={room} me={me} isAdmin={isAdmin} />;
  }

  if (room.gameState?.state === GameStateState.ResultWin) {
    return <ResultWinScreen />;
  }

  if (room.gameState?.state === GameStateState.ResultLose) {
    return <ResultLoseScreen room={room} />;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <h1 className="text-2xl font-bold">Game is in progress</h1>
      <code>{JSON.stringify(room.gameState)}</code>
    </div>
  );
}

const WaitingScreen = ({ room, isAdmin }: { room: Room; isAdmin: boolean }) => {
  const moveToRoleAssignment = () => {
    const users = room.users!;
    const spyIndex = Math.floor(Math.random() * users.length);

    const spy = users[spyIndex];

    room.gameState!.spy = spy;
    const accounts = room.users!;
    for (const account of accounts) {
      room.gameState!.activeUsers.push(account);
    }
    console.log(room.gameState.activeUsers);
    room.gameState!.state = GameStateState.RoleAssignment;
  };

  return (
    <div className="flex flex-col items-center justify-center w-64 h-full gap-4 mx-auto">
      <h1 className="text-4xl font-bold">{room.name}</h1>

      <div className="flex flex-col items-start justify-center w-full gap-4">
        {!isAdmin && <p>Waiting for the admin to start the game.</p>}
        {isAdmin && (
          <>
            <h2 className="text-xl font-bold">Join by QR Code</h2>
            {window && <QRCode value={window.location.href} size={256} />}
            <Button
              className="h-24 w-64 text-2xl my-8"
              onClick={() => moveToRoleAssignment()}
            >
              Start
            </Button>
          </>
        )}
        <h2 className="text-xl font-bold">Participants</h2>
        <div className="flex flex-col items-center justify-center w-full gap-4">
          {room.users?.map((user) => (
            <div
              key={user!.id}
              className="flex flex-row items-center justify-start w-full gap-4"
            >
              <Avatar>
                <AvatarImage />
                <AvatarFallback>
                  {user!.profile?.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2lg font-bold">{user!.profile?.name}</h1>
              {isAdmin && (
                <Button
                  onClick={() => {
                    room.users = room.users!.filter((v) => v!.id !== user!.id);
                  }}
                  className="ml-auto"
                  variant="destructive"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RoleAssignmentScreen = ({
  room,
  me,
  isAdmin,
}: {
  room: Room;
  me: JazzAccount;
  isAdmin: boolean;
}) => {
  const role = room.gameState?.spy?.id === me.id ? "spy" : "agent";

  useEffect(() => {
    if (isAdmin) {
      setTimeout(() => {
        room.gameState!.state = GameStateState.LocationReveal;
      }, 5000);
    }
  }, [isAdmin]);

  return (
    <div className="flex flex-col items-center justify-center w-64 h-full gap-4 mx-auto">
      <h1 className="text-4xl font-bold">You are a:</h1>

      <h1 className="text-4xl font-bold">{role.toUpperCase()}</h1>
    </div>
  );
};

const LocationRevealScreen = ({
  room,
  me,
  isAdmin,
}: {
  room: Room;
  me: JazzAccount;
  isAdmin: boolean;
}) => {
  const role = room.gameState?.spy?.id === me.id ? "spy" : "agent";

  useEffect(() => {
    if (isAdmin) {
      setTimeout(() => {
        room.gameState!.state = GameStateState.Interrogate;
      }, 5000);
    }
  }, [isAdmin]);

  return (
    <div className="flex flex-col items-center justify-center w-64 h-full gap-4 mx-auto">
      {role === "spy" ? (
        <>
          <h1 className="text-4xl font-bold">You are a:</h1>

          <h1 className="text-4xl font-bold">{role.toUpperCase()}</h1>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-bold">The location is:</h1>

          <h1 className="text-4xl font-bold">{room.gameState?.location}</h1>
        </>
      )}
    </div>
  );
};

const InterrogateScreen = ({
  room,
  me,
  isAdmin,
}: {
  room: Room;
  me: JazzAccount;
  isAdmin: boolean;
}) => {
  const role = room.gameState?.spy?.id === me.id ? "spy" : "agent";
  const gameInterrogationTime = room.sessionTime;
  const killed = room.gameState?.killedUsers?.some((u) => u.id === me.id);

  const [timeLeft, setTimeLeft] = useState(gameInterrogationTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevSeconds) => prevSeconds - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (isAdmin) {
      setTimeout(() => {
        room.gameState!.state = GameStateState.Vote;
      }, gameInterrogationTime * 1000);
    }
  }, [isAdmin, gameInterrogationTime]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeInSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  };

  if (killed) {
    return (
      <div className="flex flex-col items-center justify-center w-64 h-full gap-4 mx-auto">
        <h1 className="text-4xl font-bold">You are dead.</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-64 h-full gap-4 mx-auto">
      {role === "spy" ? (
        <>
          <h1 className="text-4xl font-bold">Fake it!</h1>
          <h1 className="text-9xl">{formatTime(timeLeft)}</h1>
          <h1 className="text-2xl font-bold">
            You are the {role.toUpperCase()}.
          </h1>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-bold">Interrogate.</h1>
          <h1 className="text-9xl">{formatTime(timeLeft)}</h1>
          <h1 className="text-2xl font-bold">
            You are in {room.gameState?.location}.
          </h1>
        </>
      )}
    </div>
  );
};

const VoteScreen = ({
  room,
  me,
  isAdmin,
}: {
  room: Room;
  me: JazzAccount;
  isAdmin: boolean;
}) => {
  const gameInterrogationTime = room.sessionTime;
  const killed = room.gameState?.killedUsers?.some((u) => u.id === me.id);

  const [timeLeft, setTimeLeft] = useState(gameInterrogationTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevSeconds) => prevSeconds - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeInSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  };

  if (killed) {
    return (
      <div className="flex flex-col items-center justify-center w-64 h-full gap-4 mx-auto">
        <h1 className="text-4xl font-bold">You are dead.</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-64 h-full gap-4 mx-auto">
      {isAdmin ? (
        <>
          <h1 className="text-4xl font-bold">Vote!</h1>
          {timeLeft > 0 && <h1 className="text-9xl">{formatTime(timeLeft)}</h1>}
          {timeLeft <= 0 && (
            <h1 className="text-2xl font-bold">Kick someone.</h1>
          )}
          {timeLeft <= 0 && (
            <div className="flex flex-col gap-4">
              {room.gameState?.activeUsers &&
                room.gameState?.activeUsers!.map((player) => {
                  console.log(player);
                  return (
                    <Button
                      key={player.id}
                      type="button"
                      onClick={() => {
                        const spy = room.gameState?.spy;
                        if (spy && player!.id === spy.id) {
                          room.gameState!.state = GameStateState.ResultWin;
                        } else {
                          if (room.gameState!.round > 0) {
                            const currentUsers = room.gameState!.activeUsers;
                            console.log(currentUsers);
                            room.gameState!.activeUsers =
                              ActiveUsersList.create([], { owner: me });
                            console.log(room.gameState!.activeUsers);
                            currentUsers?.forEach((user) => {
                              if (user.id !== player.id) {
                                room.gameState!.activeUsers!.push(user);
                              } else {
                                room.gameState!.killedUsers.push(user);
                              }
                            });
                            console.log(room.gameState.toJSON());

                            if (room.gameState!.activeUsers!.length === 1) {
                              room.gameState!.state = GameStateState.ResultLose;
                            }

                            room.gameState!.round -= 1;
                            room.gameState!.state = GameStateState.Interrogate;
                          } else {
                            room.gameState!.state = GameStateState.ResultLose;
                          }
                        }
                      }}
                    >
                      {player.profile?.name}
                    </Button>
                  );
                })}
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-4xl font-bold">Vote.</h1>
          <h1 className="text-9xl">{formatTime(timeLeft)}</h1>
          {timeLeft <= 0 && (
            <h1 className="text-2xl font-bold">Waiting on admin.</h1>
          )}
        </>
      )}
    </div>
  );
};

const ResultWinScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center w-64 h-full gap-4 mx-auto">
      <h1 className="text-4xl font-bold">You Win!</h1>
    </div>
  );
};

const ResultLoseScreen = ({ room }: { room: Room }) => {
  return (
    <div className="flex flex-col items-center justify-center w-64 h-full gap-4 mx-auto">
      <h1 className="text-4xl font-bold">You Lost!</h1>
      <h1 className="text-2xl font-bold">
        The spy was {room.gameState?.spy?.profile?.name}.
      </h1>
    </div>
  );
};
