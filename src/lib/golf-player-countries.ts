// Primary lookup: playerId → ISO 3166-1 alpha-2 country code
const PLAYER_ID_COUNTRIES: Record<string, string> = {
  // Genesis Invitational 2026 field + other known players
  "60004": "US", // Jacob Bridgeman
  "48117": "US", // Kurt Kitayama
  "28237": "IE", // Rory McIlroy (Northern Ireland)
  "24502": "AU", // Adam Scott
  "63343": "ZA", // Aldrich Potgieter
  "47420": "US", // Jake Knapp
  "50525": "US", // Collin Morikawa
  "57366": "US", // Cameron Young
  "30911": "GB", // Tommy Fleetwood
  "29936": "NZ", // Ryan Fox
  "48081": "US", // Xander Schauffele
  "37378": "AU", // Min Woo Lee
  "46046": "US", // Scottie Scheffler
  "34046": "US", // Jordan Spieth
  "27349": "SE", // Alex Noren
  "55893": "US", // Sam Stevens
  "59836": "US", // Pierceson Coody
  "56630": "US", // Akshay Bhatia
  "51003": "GB", // Marco Penge
  "52955": "SE", // Ludvig Åberg
  "52215": "GB", // Robert MacIntyre
  "34099": "US", // Harris English
  "51634": "US", // Sahith Theegala
  "33204": "IE", // Shane Lowry
  "59141": "US", // Matt McCarty
  "40098": "GB", // Matt Fitzpatrick
  "51977": "US", // Max Greyserman
  "32102": "US", // Rickie Fowler
  "59018": "US", // Ryan Gerard
  "25493": "CA", // Nick Taylor
  "32839": "JP", // Hideki Matsuyama
  "29725": "US", // Tony Finau
  "46414": "GB", // Aaron Rai
  "37455": "KR", // Si Woo Kim
  "36699": "US", // Patrick Rodgers
  "55182": "KR", // Tom Kim
  "52666": "FI", // Sami Välimäki
  "39997": "CA", // Corey Conners
  "39977": "US", // Max Homa
  "35450": "US", // Patrick Cantlay
  "46717": "NO", // Viktor Hovland
  "54591": "US", // Ben Griffin
  "51766": "US", // Wyndham Clark
  "27064": "VE", // Jhonattan Vegas
  "51287": "JP", // Ryo Hisatsune
  "40250": "CA", // Taylor Pendrith
  "51997": "US", // Andrew Novak
  "47993": "US", // Denny McCarthy
  "48867": "DE", // Matti Schmid
  "49960": "AT", // Sepp Straka
  "27644": "US", // Brian Harman
  "51950": "US", // Max McGreevy
  "51349": "CO", // Nico Echavarria
  "47504": "US", // Sam Burns
  "46442": "US", // Maverick McNealy
  "34098": "US", // Russell Henley
  "57975": "GB", // Harry Hall
  "40026": "US", // Daniel Berger
  "46443": "US", // Brian Campbell
  "49771": "US", // J.T. Poston
  "51696": "US", // Rico Hoey
  "45242": "US", // Kevin Yu
  "25900": "US", // Lucas Glover
  "59095": "US", // Chris Gotterup
  "22405": "GB", // Justin Rose
  "35532": "US", // Tom Hoge
  "33141": "US", // Keegan Bradley
  "34021": "US", // Bud Cauley
  "39975": "US", // Michael Kim
  "39324": "US", // J.J. Spaun
  "28089": "AU", // Jason Day
  "54421": "ZA", // Garrick Higgo
  // Other well-known players
  "40058": "US", // Justin Thomas
  "25900": "US", // Lucas Glover
  "30925": "US", // Dustin Johnson
  "28089": "AU", // Jason Day
  "46427": "US", // Brooks Koepka
  "40026": "US", // Bryson DeChambeau
  "29725": "US", // Tony Finau
  "27644": "US", // Brian Harman
  "34098": "US", // Russell Henley
  "22405": "GB", // Justin Rose
  "28237": "IE", // Rory McIlroy
  "27349": "SE", // Alex Noren
  "29564": "ES", // Jon Rahm
  "51945": "ZA", // Christiaan Bezuidenhout
  "46454": "ZA", // Erik van Rooyen
  "34563": "AU", // Marc Leishman
  "26329": "AU", // Jason Day
  "47347": "DK", // Nicolai Højgaard
  "52709": "DK", // Rasmus Højgaard
  "27974": "ES", // Sergio Garcia
  "46940": "IT", // Francesco Molinari
  "47319": "BE", // Thomas Pieters
  "28089": "AU", // Jason Day
  "28974": "US", // Bubba Watson
  "30836": "GB", // Lee Westwood
  "32150": "GB", // Ian Poulter
};

// Fallback: lastName → country (for players not in ID map)
const LASTNAME_COUNTRIES: Record<string, string> = {
  Scheffler: "US", Thomas: "US", Spieth: "US", Fowler: "US",
  Clark: "US", Harman: "US", Henley: "US", Bradley: "US",
  Burns: "US", Homa: "US", Cantlay: "US", Finau: "US",
  Glover: "US", Young: "US", Hoge: "US", Poston: "US",
  Novak: "US", McCarthy: "US", McGreevy: "US", McNealy: "US",
  Berger: "US", Campbell: "US", Theegala: "US", Greyserman: "US",
  English: "US", Coody: "US", Bhatia: "US", Stevens: "US",
  Gerard: "US", Griffin: "US", Gotterup: "US", Cauley: "US",
  Bridgeman: "US", Kitayama: "US", Knapp: "US", Rodgers: "US",
  Schauffele: "US", Morikawa: "US",
  McIlroy: "IE", Lowry: "IE", McDowell: "IE",
  Fleetwood: "GB", Fitzpatrick: "GB", Rose: "GB", Rai: "GB",
  Hall: "GB", MacIntyre: "GB", Penge: "GB", Willett: "GB",
  Hatton: "GB", Casey: "GB", Westwood: "GB", Poulter: "GB",
  Scott: "AU", Day: "AU", Leishman: "AU",
  Fox: "NZ",
  Potgieter: "ZA", Higgo: "ZA", Bezuidenhout: "ZA", Burmester: "ZA",
  Hovland: "NO",
  Noren: "SE", Aberg: "SE",
  Straka: "AT",
  Schmid: "DE", Kaymer: "DE", Langer: "DE",
  Matsuyama: "JP", Hisatsune: "JP",
  Conners: "CA", Taylor: "CA", Pendrith: "CA", Hughes: "CA",
  Vegas: "VE",
  Echavarria: "CO",
  Valimaki: "FI",
  Rahm: "ES", Garcia: "ES",
  Pieters: "BE",
  Molinari: "IT",
};

export function getPlayerCountryCode(
  playerId: string,
  firstName: string,
  lastName: string
): string | null {
  // 1. Try playerId first (most accurate)
  if (PLAYER_ID_COUNTRIES[playerId]) return PLAYER_ID_COUNTRIES[playerId].toLowerCase();

  // 2. Try exact lastName
  if (LASTNAME_COUNTRIES[lastName]) return LASTNAME_COUNTRIES[lastName].toLowerCase();

  // 3. Try lastName without accents (e.g. Åberg → Aberg)
  const normalized = lastName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (LASTNAME_COUNTRIES[normalized]) return LASTNAME_COUNTRIES[normalized].toLowerCase();

  return null;
}
