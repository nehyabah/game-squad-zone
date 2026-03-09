import { FastifyInstance } from "fastify";
import https from "https";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "d1183719e6msh532ead7af6fa213p15c074jsn709877193329";
const RAPIDAPI_HOST = "live-golf-data.p.rapidapi.com";

function fetchGolfApi(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: RAPIDAPI_HOST,
      path,
      method: "GET",
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Invalid JSON from golf API"));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

export default async function golfRoutes(app: FastifyInstance) {
  // GET /api/golf/schedule?year=2026
  app.get("/golf/schedule", { preHandler: [app.auth] }, async (request: any, reply) => {
    const year = (request.query as any).year || new Date().getFullYear();
    try {
      const data = await fetchGolfApi(`/schedule?orgId=1&year=${year}`);
      return data;
    } catch (err: any) {
      return reply.status(500).send({ error: "Failed to fetch golf schedule", details: err.message });
    }
  });

  // GET /api/golf/leaderboard?tournId=007&year=2026
  app.get("/golf/leaderboard", { preHandler: [app.auth] }, async (request: any, reply) => {
    const { tournId, year } = request.query as any;
    if (!tournId) return reply.status(400).send({ error: "tournId is required" });
    const y = year || new Date().getFullYear();
    try {
      const data = await fetchGolfApi(`/leaderboard?orgId=1&tournId=${tournId}&year=${y}`);
      return data;
    } catch (err: any) {
      return reply.status(500).send({ error: "Failed to fetch golf leaderboard", details: err.message });
    }
  });
}
