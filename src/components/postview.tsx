import Image from "next/image";
import Link from "next/link";
import TimeAgo from "timeago-react";
import type { RouterOutputs } from "~/utils/api";

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div
      key={post.id}
      className="flex gap-4 border-b border-slate-400 p-4 text-white"
    >
      <Image
        alt={`@${author.username || ""}'s profile picture`}
        width={56}
        height={56}
        src={author.profileImageUrl}
        className="h-14 w-14 rounded-full"
      />
      <div>
        <div>
          <Link href={`/${author.username || ""}`}>
            <span>{`@${author.username || ""} · `}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span>
              <TimeAgo
                className="font-thin"
                datetime={post.createdAt}
                locale="en_US"
              />
            </span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
};
