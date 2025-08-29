import React from 'react';

const nflTeams = [
  { name: 'Cardinals', code: 'ARI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png' },
  { name: 'Falcons', code: 'ATL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png' },
  { name: 'Ravens', code: 'BAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png' },
  { name: 'Bills', code: 'BUF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
  { name: 'Panthers', code: 'CAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png' },
  { name: 'Bears', code: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
  { name: 'Bengals', code: 'CIN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png' },
  { name: 'Browns', code: 'CLE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png' },
  { name: 'Cowboys', code: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
  { name: 'Broncos', code: 'DEN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png' },
  { name: 'Lions', code: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png' },
  { name: 'Packers', code: 'GB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
  { name: 'Texans', code: 'HOU', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png' },
  { name: 'Colts', code: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png' },
  { name: 'Jaguars', code: 'JAX', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png' },
  { name: 'Jets', code: 'NYJ', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png' },
  { name: 'Chiefs', code: 'KC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
  { name: 'Raiders', code: 'LV', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
  { name: 'Chargers', code: 'LAC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' },
  { name: 'Rams', code: 'LAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png' },
  { name: 'Dolphins', code: 'MIA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' },
  { name: 'Vikings', code: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png' },
  { name: 'Patriots', code: 'NE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
  { name: 'Saints', code: 'NO', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
  { name: 'Giants', code: 'NYG', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
  { name: 'Eagles', code: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' },
  { name: 'Steelers', code: 'PIT', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' },
  { name: '49ers', code: 'SF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
  { name: 'Seahawks', code: 'SEA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' },
  { name: 'Buccaneers', code: 'TB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' },
  { name: 'Titans', code: 'TEN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png' },
  { name: 'Commanders', code: 'WAS', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' }
];

const TeamLogosBanner = () => {
  // Duplicate the array to create seamless loop
  const duplicatedTeams = [...nflTeams, ...nflTeams];

  return (
    <div className="w-full overflow-hidden py-3 sm:py-4 relative">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-background to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-background to-transparent z-10"></div>
      
      {/* Scrolling logos container */}
      <div className="flex animate-scroll-left">
        <div className="flex space-x-6 sm:space-x-8 animate-none">
          {duplicatedTeams.map((team, index) => (
            <div
              key={`${team.code}-${index}`}
              className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 hover:scale-110 transition-transform duration-300"
            >
              <img
                src={team.logo}
                alt={`${team.name} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamLogosBanner;