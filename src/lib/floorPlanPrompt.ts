/**
 * Prompt do wygenerowania planu mieszkania w tym samym stylu co plan
 * mieszkania testowego (content/images/apartment-floor-plan.png).
 * Wklej do generatora obrazów (np. Gemini, ChatGPT) razem ze szkicem
 * albo zdjęciem prawdziwego rzutu.
 */
export function buildFloorPlanPrompt(householdName: string): string {
  return `Wygeneruj plan mieszkania „${householdName}” na podstawie załączonego szkicu / rzutu (zachowaj dokładny układ, proporcje pomieszczeń, drzwi i okna).

Styl — dokładnie taki:
- widok z góry, idealnie prostopadły (2D, bez perspektywy i bez rzutu izometrycznego), fotorealistyczny render architektoniczny,
- ciemny, przytulny, luksusowy klimat nocny: ciemne podłogi z desek orzechowych, ciemnografitowe ściany,
- ściany obrysowane cienką, ciepłą, bursztynowo-miedzianą świecącą linią,
- meble w ciemnych grafitach i brązach (sofa, łóżka z pościelą, stół z krzesłami, wyspa kuchenna, biurka),
- łazienki z ciemnoszarych płytek kamiennych; wanna, umywalki i toalety w ciemnym grafitowym kolorze (nie białe),
- punktowe ciepłe światła: lampki nocne, świece, kinkiety rzucające miękką poświatę,
- drzwi jako cienkie łuki otwarcia, okna jako jasne przerwy w ścianach,
- kilka roślin doniczkowych dla kontrastu.

Wymagania:
- całe mieszkanie widoczne od krawędzi do krawędzi, bez marginesów i tła poza obrysem,
- format poziomy, proporcje ok. 5:4,
- bez napisów, wymiarów, legendy, ikon interfejsu, ramek i znaków wodnych,
- każde pomieszczenie wyraźnie rozpoznawalne (salon, kuchnia, łazienka, sypialnie, przedpokój).`;
}
