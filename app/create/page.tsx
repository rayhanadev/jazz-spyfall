"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAccount } from "@/lib/jazz";
import {
  ActiveUsersList,
  GameState,
  GameStateState,
  KilledUsersList,
  Room,
  UsersList,
} from "@/lib/jazz/schema";
import { Group } from "jazz-tools";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(3).max(50),
});

export default function Page() {
  const { me } = useAccount();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const globalReadGroup = Group.create({ owner: me });
    globalReadGroup.addMember("everyone", "reader");

    const globalWriteGroup = Group.create({ owner: me });
    globalWriteGroup.addMember("everyone", "writer");

    const gameState = GameState.create(
      {
        state: GameStateState.Waiting,
        location: "France",
        spy: null,
        activeUsers: ActiveUsersList.create([], { owner: globalReadGroup }),
        killedUsers: KilledUsersList.create([], { owner: globalReadGroup }),
        round: 5,
      },
      { owner: globalReadGroup },
    );

    const room = Room.create(
      {
        name: values.name,
        users: UsersList.create([me], { owner: globalWriteGroup }),

        sessionTime: 120,
        maxUsers: 10,

        gameState: gameState,
      },
      { owner: globalReadGroup },
    );

    me.profile!.activeRoom = room;

    router.push(`/r/${room.id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}
