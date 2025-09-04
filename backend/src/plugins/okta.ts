// src/plugins/okta.ts (actually Auth0)
import fp from "fastify-plugin";

declare module "fastify" {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface FastifyInstance {
    verifyOktaIdToken: (idToken: string) => Promise<any>;
  }
}

export default fp(async (app) => {
  const domain = process.env.OKTA_DOMAIN!; // Actually Auth0 domain
  const issuer = `https://${domain}/`; // Auth0 uses trailing slash
  const clientId = process.env.OKTA_CLIENT_ID!;

  // Dynamically import jose to handle ESM
  const { createRemoteJWKSet, jwtVerify } = await import("jose");

  // Auth0 uses /.well-known/jwks.json
  const jwks = createRemoteJWKSet(
    new URL(`https://${domain}/.well-known/jwks.json`)
  );

  app.decorate("verifyOktaIdToken", async (idToken: string) => {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer, // https://dev-xfta2nvjhpm5pku5.us.auth0.com/
      audience: clientId, // Your client ID
    });
    return payload;
  });
});
