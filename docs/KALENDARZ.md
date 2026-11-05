# Kalendarz: własny, prywatny, per konto

Kalendarz należy do **konta**, nie do mieszkania. Widzi go tylko właściciel, w każdym swoim mieszkaniu (zakładka Kalendarz). Wspólny kalendarz domu widzą wszyscy domownicy. Ustawia go administrator w Ustawieniach → Mieszkanie (link iCal i fragmenty adresu do wykrywania gości). Zmienna `GOOGLE_CALENDAR_ICAL_URL` nie jest już używana.

Są dwa sposoby, oba w Ustawieniach → **Mój kalendarz**:

1. **Link iCal** (najprościej). W Google Calendar: ⚙ Ustawienia → kalendarz → „Tajny adres w formacie iCal”. Działa też link z Outlooka i iCloud. Nie wymaga OAuth, kluczy ani Redis, więc nie ma żadnego ekranu zgody. Link zapisuje się w `users/{uid}/private/calendar`, do którego dostęp ma tylko właściciel. Serwer dostaje go z każdym zapytaniem i nigdzie go nie przechowuje. Przyjmowane są tylko adresy https znanych dostawców.
2. **Połączenie Google (OAuth)** — konfiguracja poniżej.

## Połączenie Google (OAuth): stałe połączenie

Zgodę Google daje się **raz**. Serwer zapamiętuje dostęp (refresh token) w bazie Redis na Vercel, a potem kalendarz działa bez pytania, także na tablecie bez konta.

Bez tej konfiguracji karta „Mój kalendarz” pokazuje, że na serwerze brakuje kluczy Google i Redis — link iCal działa mimo to.

## 1. Google Cloud: klucze OAuth

Konsola: https://console.cloud.google.com/apis/credentials?project=harmony-home-95c3b

1. **Włącz Google Calendar API:** APIs & Services → Library → „Google Calendar API” → Enable.
2. **OAuth consent screen** (Google Auth Platform → Audience):
   - Ustaw **Publishing status: In production**.
   - W trybie *Testing* Google unieważnia dostęp po 7 dniach i trzeba by dawać zgodę co tydzień.
   - Aplikacja bez weryfikacji pokaże ostrzeżenie „Google nie zweryfikował aplikacji” tylko przy tej jednej zgodzie. Przejdź przez „Zaawansowane → Przejdź do…”.
3. **Credentials → Create credentials → OAuth client ID:**
   - typ **Web application**;
   - Authorized redirect URIs (logowanie startuje z Ustawień → „Połącz Google”, adres `/api/auth/google` już nie istnieje):
     - `https://harmony-home-three.vercel.app/api/auth/google/callback`
     - `http://localhost:3000/api/auth/google/callback` (dla pracy lokalnej);
   - skopiuj **Client ID** i **Client secret**.

## 2. Vercel: baza Redis

Projekt harmony-home → **Storage** → Create Database → **Upstash for Redis** (plan darmowy) → połącz z projektem dla środowiska Production.

Vercel sam dopisze `KV_REST_API_URL` i `KV_REST_API_TOKEN`.

## 3. Vercel: zmienne środowiskowe

Projekt harmony-home → Settings → **Environment Variables**, środowisko Production:

| Nazwa | Wartość |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID z kroku 1 |
| `GOOGLE_CLIENT_SECRET` | Client secret z kroku 1 |
| `AUTH_SECRET` | losowy ciąg, min. 32 znaki (np. `openssl rand -base64 32`) |
| `APP_URL` | `https://harmony-home-three.vercel.app` |

Potem: Deployments → ostatni → **Redeploy**. Nowe zmienne działają dopiero w nowym buildzie.

## 4. W aplikacji

1. Ustawienia → Konto Google → wybierz **swój profil domownika**.
2. Kliknij **„Połącz kalendarz”**. Google zapyta o zgodę raz.
3. Po powrocie karta pokaże „Kalendarz zapamiętany na serwerze”. Kalendarze włączysz lub wyłączysz niżej w Ustawieniach.

## Jak to działa

- **Logowanie Google** prosi tylko o e-mail i profil, więc nie pokazuje ekranu zgody ani ostrzeżenia. Sesja zostaje w przeglądarce, a kolejne wejście nie wymaga logowania.
- **Kalendarz** łączy się przez serwer (`/api/auth/google`) z `access_type=offline`. Refresh token trafia do Redis, a serwer sam odświeża godzinne tokeny.
- **Automatyczne łączenie** po zalogowaniu następuje najwyżej raz na urządzenie (`localStorage: calendarOAuthAttempted`) i tylko wtedy, gdy serwer ma klucze i Redis. Nikt nie trafia na ekran zgody przy każdym wejściu.
- **`APP_URL`** musi wskazywać domenę produkcyjną. Adres deploymentu (`VERCEL_URL`) zmienia się co build i Google odrzuciłby redirect.
