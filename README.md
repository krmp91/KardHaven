# KardHaven

KardHaven by KR Production — en mobilapp til at registrere, søge, værdisætte og senere scanne din Pokémon-kortsamling.

## Formål

KardHaven skal være en mobilapp til at:

- Registrere din Pokémon-kortsamling.
- Søge efter kort.
- Holde styr på stand, sprog og variant.
- Se købspris og estimeret markedsværdi.
- Holde styr på dubletter og ønskeliste.
- Senere scanne kort med mobilkameraet.

Vi starter med Pokémon, men bygger databasen, så andre samlekort potentielt kan tilføjes senere.

## Teknologier

| Del | Teknologi |
| --- | --- |
| Mobilapp | React Native med Expo |
| Programmeringssprog | TypeScript |
| Navigation | Expo Router |
| UI | React Native-komponenter og eventuelt NativeWind |
| Database | Supabase PostgreSQL |
| Login | Supabase Auth |
| Billeder | Supabase Storage |
| Kortkatalog | TCGdex |
| Priser | Pokémon TCG API/Cardmarket-data |
| Scanner senere | Expo Camera, OCR og billedsammenligning |
| Scanner-backend senere | Python med FastAPI eller Flask |
| Versionsstyring | GitHub |

## Databaseindstillinger

KardHaven-projektet er oprettet i Supabase. De relevante indstillinger er:

- Data API: aktiveret.
- Automatic RLS: aktiveret.
- Region: Frankfurt.
- Nye tabeller skal have individuelle RLS-policies.
- Database-passwordet skal gemmes sikkert.
- NAS'en bruges senere til eksterne backups, ikke som produktionsserver.

## Version 1 – grundlæggende samlingsapp

Første version skal kunne:

- Oprette bruger og logge ind.
- Søge efter Pokémon-kort.
- Se kortets billede og oplysninger.
- Tilføje et kort til samlingen.
- Redigere og fjerne registrerede kort.
- Angive antal, stand, sprog og variant.
- Registrere købspris og købsdato.
- Vise hele brugerens samling.
- Oprette ønskeliste.
- Se dubletter.
- Vise en enkel samlet værdi.

### Oplysninger om hvert kort

Et registreret eksemplar skal kunne indeholde:

- Kortets ID.
- Ejerens bruger-ID.
- Antal.
- Sprog.
- Normal, holo eller reverse holo.
- Stand: NM, EX, GD, LP, PL eller poor.
- Raw eller graded.
- Graderingsselskab og karakter.
- Købspris.
- Købsdato.
- Estimeret markedsværdi.
- Fysisk placering, eksempelvis mappe og side.
- Personlige noter.
- Eventuelt egne billeder.

### Foreløbige databasetabeller

- `profiles`
- `cards`
- `sets`
- `collection_items`
- `wishlists`
- `price_history`
- `storage_locations`

`cards` og `sets` indeholder katalogdata. `collection_items` indeholder brugerens egne eksemplarer og oplysninger.

Alle brugertabeller får et `user_id`, og RLS sørger for, at en bruger kun kan se og ændre sine egne data.

## Version 2 – kortscanner

Scanneren skal:

- Åbne kameraet.
- Finde kortets kanter.
- Beskære og rette billedet.
- Læse navn og kortnummer med OCR.
- Søge efter mulige kort i kataloget.
- Sammenligne billedet med referencebilleder.
- Vise de bedste forslag.
- Lade brugeren bekræfte det korrekte kort.
- Tilføje kortet til samlingen.

Scanneren skal ikke automatisk bedømme standen i starten.

## Version 3 – priser og statistik

- Automatisk opdatering af priser.
- Prisudvikling over tid.
- Købspris sammenlignet med markedsværdi.
- Beregnet gevinst eller tab.
- Samlingsværdi fordelt på sæt.
- Dyreste kort.
- Bedste og dårligste køb.
- Eksport til CSV.
- Overblik over manglende kort i et sæt.

## Version 4 – større funktioner

- Hurtig scanning af mange kort.
- Mapper og virtuelle binders.
- Trade analyzer.
- Salgsliste.
- Offentlig, delbar samling.
- Deling med andre samlere.
- Flere typer samlekort.
- Sociale funktioner.
- Eventuel hjælp til vurdering af kortstand.

## Den næste konkrete rækkefølge

1. Oprette GitHub-repository til KardHaven.
2. Oprette Expo-projektet med TypeScript.
3. Forbinde appen til Supabase.
4. Opsætte miljøvariabler sikkert.
5. Lave login og brugerprofil.
6. Designe databasestrukturen.
7. Oprette tabeller, policies og migrations.
8. Integrere Pokémon-kataloget.
9. Bygge søgning og kortvisning.
10. Bygge "Tilføj til samling".
11. Lave samlingsoversigten.
12. Derefter begynde på scanneren.

**Første milepæl:** du kan logge ind, finde et bestemt Pokémon-kort og tilføje det til din egen samling.
