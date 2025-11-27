import { FastifyInstance } from "fastify";
import { getCurrentWeekIdSync } from "../../utils/weekUtils";

export default async function gameRoutes(app: FastifyInstance) {
  // GET /api/games - Get games filtered by week (excludes Thursday and Friday games)
  app.get("/games", async (req, reply) => {
    try {
      const { weekId } = req.query as { weekId?: string };
      const targetWeekId = weekId || getCurrentWeekIdSync();

      console.log(
        `Games API: Requested weekId="${weekId}", targetWeekId="${targetWeekId}"`
      );

      const games = await app.prisma.game.findMany({
        where: { weekId: targetWeekId },
        orderBy: { startAtUtc: "asc" },
        include: {
          lines: {
            where: {
              OR: [
                { source: "odds-api-friday" },
                { source: "odds-api-wednesday" },
                { source: "odds-api" },
              ],
            },
            orderBy: { fetchedAtUtc: "desc" },
            take: 1,
          },
        },
      });

      // Filter out Thursday and Friday games (in Dublin timezone)
      console.log("\n=== THURSDAY/FRIDAY FILTER DEBUG ===");
      console.log(`Total games fetched: ${games.length}`);

      const filteredGames = games.filter((game) => {
        // Ensure startAtUtc is a Date object
        const gameDate =
          game.startAtUtc instanceof Date
            ? game.startAtUtc
            : new Date(game.startAtUtc);

        // Create a date formatter for Dublin timezone
        const dublinFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Europe/Dublin",
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const formattedDate = dublinFormatter.format(gameDate);
        const dayOfWeek = new Intl.DateTimeFormat("en-US", {
          timeZone: "Europe/Dublin",
          weekday: "long",
        }).format(gameDate);

        console.log(`${game.awayTeam} @ ${game.homeTeam}:`);
        console.log(`  UTC: ${gameDate.toISOString()}`);
        console.log(`  Dublin: ${formattedDate}`);
        console.log(`  Day: ${dayOfWeek}`);

        if (dayOfWeek === "Thursday") {
          console.log(`  ✗ EXCLUDING (Thursday game)`);
          return false;
        }

        if (dayOfWeek === "Friday") {
          console.log(`  ✗ EXCLUDING (Friday game)`);
          return false;
        }

        console.log(`  ✓ KEEPING`);
        return true;
      });

      console.log(`\nFiltered games count: ${filteredGames.length}`);
      console.log("=== END THURSDAY/FRIDAY FILTER ===\n");

      // Transform to match frontend expectations
      const transformedGames = filteredGames.map((game) => {
        const line = game.lines[0];
        return {
          id: game.id,
          homeTeam: {
            name: game.homeTeam,
            logo: getTeamLogo(game.homeTeam),
            code: getTeamCode(game.homeTeam),
          },
          awayTeam: {
            name: game.awayTeam,
            logo: getTeamLogo(game.awayTeam),
            code: getTeamCode(game.awayTeam),
          },
          spread: line?.spread || 0,
          time: game.startAtUtc.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
          }),
          commenceTime: game.startAtUtc.toISOString(),
          week: parseInt(game.weekId.replace("2025-W", "")),
        };
      });

      console.log(
        `Returning ${transformedGames.length} games (excluded Thursday and Friday games)`
      );
      return transformedGames;
    } catch (error) {
      console.error("Error fetching games:", error);
      return reply.status(500).send({ error: "Failed to fetch games" });
    }
  });
}

// Team mapping helpers
function getTeamLogo(teamName: string): string {
  const teamMap: Record<string, string> = {
    "Philadelphia Eagles": "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png",
    "Dallas Cowboys": "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
    "Los Angeles Chargers": "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png",
    "Kansas City Chiefs": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
    "Atlanta Falcons": "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png",
    "Tampa Bay Buccaneers": "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
    "Jacksonville Jaguars": "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png",
    "Carolina Panthers": "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
    "Washington Commanders":
      "https://a.espncdn.com/i/teamlogos/nfl/500/was.png",
    "New York Giants": "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png",
    "New Orleans Saints": "https://a.espncdn.com/i/teamlogos/nfl/500/no.png",
    "Arizona Cardinals": "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png",
    "Cleveland Browns": "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
    "Cincinnati Bengals": "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png",
    "Indianapolis Colts": "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png",
    "Miami Dolphins": "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png",
    "New England Patriots": "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
    "Las Vegas Raiders": "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png",
    "New York Jets": "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
    "Pittsburgh Steelers": "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
    "Buffalo Bills": "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
    "Baltimore Ravens": "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png",
    "Houston Texans": "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png",
    "Tennessee Titans": "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
    "Denver Broncos": "https://a.espncdn.com/i/teamlogos/nfl/500/den.png",
    "Chicago Bears": "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",
    "Detroit Lions": "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
    "Green Bay Packers": "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
    "Minnesota Vikings": "https://a.espncdn.com/i/teamlogos/nfl/500/min.png",
    "Los Angeles Rams": "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",
    "San Francisco 49ers": "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
    "Seattle Seahawks": "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
  };

  return (
    teamMap[teamName] ||
    "https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png"
  );
}

function getTeamCode(teamName: string): string {
  const codeMap: Record<string, string> = {
    "Philadelphia Eagles": "PHI",
    "Dallas Cowboys": "DAL",
    "Los Angeles Chargers": "LAC",
    "Kansas City Chiefs": "KC",
    "Atlanta Falcons": "ATL",
    "Tampa Bay Buccaneers": "TB",
    "Jacksonville Jaguars": "JAX",
    "Carolina Panthers": "CAR",
    "Washington Commanders": "WAS",
    "New York Giants": "NYG",
    "New Orleans Saints": "NO",
    "Arizona Cardinals": "ARI",
    "Cleveland Browns": "CLE",
    "Cincinnati Bengals": "CIN",
    "Indianapolis Colts": "IND",
    "Miami Dolphins": "MIA",
    "New England Patriots": "NE",
    "Las Vegas Raiders": "LV",
    "New York Jets": "NYJ",
    "Pittsburgh Steelers": "PIT",
    "Buffalo Bills": "BUF",
    "Baltimore Ravens": "BAL",
    "Houston Texans": "HOU",
    "Tennessee Titans": "TEN",
    "Denver Broncos": "DEN",
    "Chicago Bears": "CHI",
    "Detroit Lions": "DET",
    "Green Bay Packers": "GB",
    "Minnesota Vikings": "MIN",
    "Los Angeles Rams": "LAR",
    "San Francisco 49ers": "SF",
    "Seattle Seahawks": "SEA",
  };

  return (
    codeMap[teamName] ||
    teamName.split(" ").pop()?.substring(0, 3).toUpperCase() ||
    "TBD"
  );
}
