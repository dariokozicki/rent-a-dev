import { clerkClient } from "@clerk/nextjs";
import { type Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { filterUserForClient } from "../helpers/mappers";

type NewType = Post[];

const addUserDataToPosts = async (posts: NewType) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);
  // This is simplified and should involce a Join instead
  // TODO review how to do this with prisma + clerk
  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);
    if (!author)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author for post not found",
      });

    return {
      post,
      author,
    };
  });
};

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/ratelimit",
});

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    return addUserDataToPosts(posts);
  }),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().min(1).max(200, "Oops! Your post is too long."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      // use Middleware instead
      const { success } = await ratelimit.limit(authorId);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const post = await ctx.prisma.post.create({
        data: { authorId, ...input },
      });

      return post;
    }),

  getPostsByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        where: {
          authorId: input.userId,
        },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });

      return addUserDataToPosts(posts);
    }),

  getPostById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      return (await addUserDataToPosts([post]))[0];
    }),
});
