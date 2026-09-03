# TODO

- Gate Mapbox search behind a future backend + user auth. Right now `hooks/useMapboxSearch.ts`
  calls the Mapbox Search Box API directly from the client with a public token — anyone with
  the app can spam the `/suggest` and `/retrieve` endpoints (and burn the Mapbox quota/bill)
  with no rate limiting or per-user attribution. Once there's a backend, proxy these calls
  through it and require an authenticated session to call them.
