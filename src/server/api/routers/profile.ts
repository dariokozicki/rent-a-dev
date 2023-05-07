import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { filterUserForClient } from "../helpers/mappers";

export const profileRouter = createTRPCRouter({
  getUserByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const user = (
        await clerkClient.users.getUserList({
          username: [input.username],
        })
      )?.[0];

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return filterUserForClient(user);
    }),
});
