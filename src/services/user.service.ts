export const handleUserSignin = async ({ body, jwt, cookie: { auth } }) => {
  const { username, password } = body;

  auth.set({
    value: await jwt.sign({ user_id: 1 }),
    httpOnly: true,
    maxAge: 7 * 86400,
    path: "*",
  });

  return `Hi ${username}! Sign in Successful!`;
};
