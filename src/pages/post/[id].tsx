import type { GetStaticProps } from "next";
import { type NextPage } from "next";
import Head from "next/head";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";
import { generateSSGHelper } from "~/server/api/helpers/ssgHelper";
import { api } from "~/utils/api";

const SinglePostPage: NextPage<{ postId: string }> = (props) => {
  const { data: fullPost } = api.posts.getPostById.useQuery({
    id: props.postId,
  });
  if (!fullPost) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{`${fullPost.author.username ?? ""} on Rent a Dev: "${
          fullPost.post.content || ""
        }"`}</title>
      </Head>
      <PageLayout>
        <PostView {...fullPost} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const postId = context.params?.id;
  if (typeof postId !== "string") throw new Error("no slug");

  await ssg.posts.getPostById.prefetch({ id: postId });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      postId,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
