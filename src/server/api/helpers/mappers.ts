import type { User } from "@clerk/nextjs/server";

export const filterUserForClient = (user: User) => {
  console.log(user.externalAccounts);
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
    externalUsername:
      user.externalAccounts.find(
        (externalAccount) => externalAccount.provider === "oauth_github"
      )?.username || null,
  };
};
