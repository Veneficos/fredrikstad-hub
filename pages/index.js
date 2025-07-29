import React, { useEffect, useState } from "react";

// Hjelpefunksjon for klokkeslett-format:
function formatDepartureTime(dt) {
  const t = new Date(dt);
  const now = new Date();
  const mins = Math.round((t - now) / 60000);
  const hhmm = t.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
  if (mins > 0 && mins <= 90) {
    return `om ${mins} min (${hhmm})`;
  }
  return hhmm;
}

// === KollektivWidget (viser kun én neste avgang per stopp) ===
function KollektivWidget({ lat, lon }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [manualStop, setManualStop] = useState('');
  const [manualResults, setManualResults] = useState([]);
  const [showManual, setShowManual] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [lastSuccess, setLastSuccess] = useState([]);

  useEffect(() => {
    if (manualStop) return; // Skipp auto hvis man søker manuelt
    async function fetchDepartures() {
      setLoading(true);
      setError(false);
      try {
        const delta = 0.02; // ~2km
        const minLat = lat - delta;
        const maxLat = lat + delta;
        const minLon = lon - delta;
        const maxLon = lon + delta;
        const stopQuery = {
          query: `
            {
              stopPlacesByBbox(
                minimumLatitude: ${minLat}
                minimumLongitude: ${minLon}
                maximumLatitude: ${maxLat}
                maximumLongitude: ${maxLon}
              ) {
                id
                name
                latitude
                longitude
              }
            }
          `
        };
        const stopRes = await fetch(
          'https://api.entur.io/journey-planner/v3/graphql',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stopQuery)
          }
        );
        const stopData = await stopRes.json();
        const stops = stopData.data?.stopPlacesByBbox || [];
        const stopsSorted = stops
          .map(s => ({
            ...s,
            distance: Math.sqrt(
              Math.pow((s.latitude - lat) * 111_000, 2) +
              Math.pow((s.longitude - lon) * 70_000, 2)
            )
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3);

        let found = false;
        const newResults = [];
        for (let stop of stopsSorted) {
          const stopId = stop.id;
          const stopDisplayName = stop.name;
          const query = {
            query: `
              {
                stopPlace(id: "${stopId}") {
                  name
                  estimatedCalls(timeRange: 7200, numberOfDepartures: 6) {
                    realtime
                    aimedDepartureTime
                    expectedDepartureTime
                    destinationDisplay {
                      frontText
                    }
                    serviceJourney {
                      line {
                        publicCode
                        transportMode
                        authority { name }
                      }
                    }
                  }
                }
              }
            `
          };
          const depRes = await fetch(
            'https://api.entur.io/journey-planner/v3/graphql',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(query)
            }
          );
          const depData = await depRes.json();
          const calls = depData.data?.stopPlace?.estimatedCalls || [];
          if (calls.length > 0) {
            newResults.push({ stopName: stopDisplayName, departures: [calls[0]], distance: stop.distance });
            found = true;
          }
        }
        setResults(newResults);
        if (found) setLastSuccess(newResults);
        setError(!found);
        setLoading(false);
      } catch (err) {
        setError(true);
        setLoading(false);
      }
    }
    fetchDepartures();
  }, [lat, lon, manualStop]);

  // Autofullfør for manuell søk
  useEffect(() => {
    if (!manualStop || manualStop.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    async function getSuggestions() {
      try {
        const search = {
          query: `
            {
              stopPlaces(name: "${manualStop}", first: 6) {
                id
                name
              }
            }
          `
        };
        const stopRes = await fetch(
          'https://api.entur.io/journey-planner/v3/graphql',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(search),
            signal: controller.signal
          }
        );
        const stopData = await stopRes.json();
        setSuggestions(stopData.data?.stopPlaces || []);
      } catch (err) {
        setSuggestions([]);
      }
    }
    getSuggestions();
    return () => controller.abort();
  }, [manualStop]);

  // Manuelt søk
  async function handleManualSearch(e, stopObj) {
    if (e) e.preventDefault();
    setManualResults([]);
    setLoading(true);
    setError(false);
    let stopToUse = stopObj;
    if (!stopToUse) {
      stopToUse = suggestions && suggestions[0] ? suggestions[0] : null;
      if (!stopToUse) {
        setLoading(false);
        setError(true);
        return;
      }
    }
    try {
      const stopId = stopToUse.id;
      const stopName = stopToUse.name;
      const query = {
        query: `
          {
            stopPlace(id: "${stopId}") {
              name
              estimatedCalls(timeRange: 7200, numberOfDepartures: 8) {
                realtime
                aimedDepartureTime
                expectedDepartureTime
                destinationDisplay {
                  frontText
                }
                serviceJourney {
                  line {
                    publicCode
                    transportMode
                    authority { name }
                  }
                }
              }
            }
          }
        `
      };
      const depRes = await fetch(
        'https://api.entur.io/journey-planner/v3/graphql',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(query)
        }
      );
      const depData = await depRes.json();
      const calls = depData.data?.stopPlace?.estimatedCalls || [];
      if (calls.length > 0) {
        setManualResults([{ stopName, departures: [calls[0]] }]);
        setError(false);
        setLastSuccess([{ stopName, departures: [calls[0]] }]);
      } else {
        setManualResults([]);
        setError(true);
      }
      setLoading(false);
    } catch (err) {
      setManualResults([]);
      setError(true);
      setLoading(false);
    }
  }

  return (
    <section style={{
      background: '#e5f6ff',
      borderRadius: '1rem',
      padding: '1.2rem 1.1rem',
      maxWidth: 370,
      width: "100%",
      boxShadow: '0 2px 8px #bee3f880',
      minHeight: 170
    }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.08rem', color: '#125772', marginBottom: '0.6rem' }}>
        🚍 Kollektivavganger i nærheten
      </h3>
      {(loading && !manualStop) ? (
        <div>Laster avganger…</div>
      ) : (results.length > 0) ? (
        results.map((stop, idx) => {
          const nextDep = stop.departures[0];
          if (!nextDep) return null;
          return (
            <div key={idx} style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: "#13607b" }}>
                {stop.stopName} {stop.distance ? <span style={{ fontWeight: 400, color: "#409", fontSize: "0.98em" }}>({Math.round(stop.distance)} m unna)</span> : null}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{
                  marginBottom: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}>
                  <span style={{
                    background: '#b2f5ea',
                    color: '#115e59',
                    borderRadius: '0.5rem',
                    padding: '0.12rem 0.5rem',
                    fontWeight: 600
                  }}>
                    {nextDep.serviceJourney.line.transportMode === 'bus' ? '🚌' :
                     nextDep.serviceJourney.line.transportMode === 'rail' ? '🚆' :
                     nextDep.serviceJourney.line.transportMode === 'tram' ? '🚊' :
                     nextDep.serviceJourney.line.transportMode === 'ferry' ? '⛴️' : '🚍'}{' '}
                    {nextDep.serviceJourney.line.publicCode}
                  </span>
                  <span>
                    {nextDep.destinationDisplay.frontText}
                  </span>
                  <span style={{ marginLeft: 'auto', color: '#055160', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDepartureTime(nextDep.expectedDepartureTime)}
                  </span>
                  {nextDep.realtime && <span style={{ color: '#00b373', fontWeight: 600, marginLeft: 6 }}>(RT)</span>}
                </li>
              </ul>
            </div>
          );
        })
      ) : (
        <>
          <div style={{ color: "#b31313", marginBottom: "0.8rem" }}>
            Fant ingen avganger for din posisjon akkurat nå.
          </div>
          <button
            style={{
              background: "#16555e",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.45rem 1rem",
              cursor: "pointer",
              marginBottom: "1rem"
            }}
            onClick={() => setShowManual(x => !x)}
          >
            {showManual ? "Skjul søk" : "Søk etter stoppested manuelt"}
          </button>
          {showManual && (
            <form onSubmit={e => handleManualSearch(e, null)} autoComplete="off">
              <input
                type="text"
                placeholder="Søk etter stoppested, f.eks. Fredrikstad bussterminal"
                value={manualStop}
                onChange={e => setManualStop(e.target.value)}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #aaa",
                  width: "90%",
                  marginBottom: "0.5rem"
                }}
                autoComplete="off"
              />
              {suggestions.length > 0 &&
                <div style={{
                  background: "#fff",
                  border: "1px solid #a5e2e9",
                  borderRadius: "0.4rem",
                  marginBottom: "0.5rem",
                  maxHeight: "130px",
                  overflowY: "auto",
                  position: "relative",
                  zIndex: 100
                }}>
                  {suggestions.map(sug =>
                    <div
                      key={sug.id}
                      style={{ padding: "0.2rem 0.8rem", cursor: "pointer" }}
                      onClick={() => { setManualStop(sug.name); handleManualSearch(null, sug); }}
                    >
                      {sug.name}
                    </div>
                  )}
                </div>
              }
              <button
                type="submit"
                style={{
                  background: "#228277",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.45rem 1.2rem",
                  cursor: "pointer",
                  marginLeft: "0.5rem"
                }}
              >
                Vis avganger
              </button>
            </form>
          )}
          {loading && manualStop && <div>Laster avganger…</div>}
          {manualResults.length > 0 &&
            manualResults.map((stop, idx) => {
              const nextDep = stop.departures[0];
              if (!nextDep) return null;
              return (
                <div key={idx} style={{ marginBottom: '1.2rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: "#13607b" }}>
                    {stop.stopName}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{
                      marginBottom: '0.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem'
                    }}>
                      <span style={{
                        background: '#b2f5ea',
                        color: '#115e59',
                        borderRadius: '0.5rem',
                        padding: '0.12rem 0.5rem',
                        fontWeight: 600
                      }}>
                        {nextDep.serviceJourney.line.transportMode === 'bus' ? '🚌' :
                         nextDep.serviceJourney.line.transportMode === 'rail' ? '🚆' :
                         nextDep.serviceJourney.line.transportMode === 'tram' ? '🚊' :
                         nextDep.serviceJourney.line.transportMode === 'ferry' ? '⛴️' : '🚍'}{' '}
                        {nextDep.serviceJourney.line.publicCode}
                      </span>
                      <span>
                        {nextDep.destinationDisplay.frontText}
                      </span>
                      <span style={{ marginLeft: 'auto', color: '#055160', fontVariantNumeric: 'tabular-nums' }}>
                        {formatDepartureTime(nextDep.expectedDepartureTime)}
                      </span>
                      {nextDep.realtime && <span style={{ color: '#00b373', fontWeight: 600, marginLeft: 6 }}>(RT)</span>}
                    </li>
                  </ul>
                </div>
              );
            })}
          {error && manualStop && !loading && manualResults.length === 0 && (
            <div style={{ color: "#a00" }}>Fant ingen avganger for valgt stoppested.</div>
          )}
        </>
      )}
      {/* Fallback: siste kjente avganger */}
      {(!loading && !manualStop && results.length === 0 && lastSuccess.length > 0) &&
        <>
          <div style={{ color: "#d85" }}>
            Viser siste kjente avganger (kan være noen minutter gamle)
          </div>
          {lastSuccess.map((stop, idx) => {
            const nextDep = stop.departures[0];
            if (!nextDep) return null;
            return (
              <div key={idx} style={{ marginBottom: '1.2rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: "#13607b" }}>
                  {stop.stopName} {stop.distance ? <span style={{ fontWeight: 400, color: "#409", fontSize: "0.98em" }}>({Math.round(stop.distance)} m unna)</span> : null}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{
                    marginBottom: '0.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}>
                    <span style={{
                      background: '#b2f5ea',
                      color: '#115e59',
                      borderRadius: '0.5rem',
                      padding: '0.12rem 0.5rem',
                      fontWeight: 600
                    }}>
                      {nextDep.serviceJourney.line.transportMode === 'bus' ? '🚌' :
                       nextDep.serviceJourney.line.transportMode === 'rail' ? '🚆' :
                       nextDep.serviceJourney.line.transportMode === 'tram' ? '🚊' :
                       nextDep.serviceJourney.line.transportMode === 'ferry' ? '⛴️' : '🚍'}{' '}
                      {nextDep.serviceJourney.line.publicCode}
                    </span>
                    <span>
                      {nextDep.destinationDisplay.frontText}
                    </span>
                    <span style={{ marginLeft: 'auto', color: '#055160', fontVariantNumeric: 'tabular-nums' }}>
                      {formatDepartureTime(nextDep.expectedDepartureTime)}
                    </span>
                    {nextDep.realtime && <span style={{ color: '#00b373', fontWeight: 600, marginLeft: 6 }}>(RT)</span>}
                  </li>
                </ul>
              </div>
            );
          })}
        </>
      }
    </section>
  );
}

// === Vær-widget (henter fra met.no) ===
function VaerWidget({ lat, lon, placeName }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // met.no Locationforecast (Ingen API-nøkkel trengs)
        const res = await fetch(
          `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
          { headers: { "User-Agent": "GeoCityHub/1.0 github.com" } }
        );
        const data = await res.json();
        const now = data.properties.timeseries[0];
        // Finn timesdata (neste 6 timer) og daglig data (neste 7 dager)
        const nextHours = data.properties.timeseries.slice(0, 7).map(e => ({
          time: e.time,
          temp: e.data.instant.details.air_temperature,
          wind: e.data.instant.details.wind_speed,
          symbol: e.data.next_1_hours?.summary.symbol_code || ""
        }));
        const nextDays = [];
        let lastDate = "";
        data.properties.timeseries.forEach(e => {
          const d = e.time.split("T")[0];
          if (d !== lastDate) {
            nextDays.push({
              date: d,
              tempMin: e.data.instant.details.air_temperature,
              tempMax: e.data.instant.details.air_temperature,
              symbol: e.data.next_6_hours?.summary.symbol_code || ""
            });
            lastDate = d;
          }
        });
        setWeather({ now, nextHours, nextDays: nextDays.slice(0, 6) });
      } catch (e) {
        setWeather(null);
      }
    }
    fetchWeather();
  }, [lat, lon]);

  if (!weather) return (
    <section style={{ background: "#fffbe8", borderRadius: "1rem", minHeight: 170, padding: "1.2rem 1.1rem" }}>
      <b>☀️ Været for {placeName || "området"}:</b>
      <div>Laster værdata…</div>
    </section>
  );

  const wicon = symb =>
    symb?.includes("rain") ? "🌧️" :
    symb?.includes("cloud") ? "⛅" :
    symb?.includes("clear") ? "☀️" :
    symb?.includes("snow") ? "❄️" :
    "🌡️";

  return (
    <section style={{
      background: '#fffbe8',
      borderRadius: '1rem',
      padding: '1.2rem 1.1rem',
      minHeight: 170,
      boxShadow: '0 2px 8px #ffecb3a1'
    }}>
      <b>☀️ Vær for {placeName || "området"}</b>
      <div style={{ margin: "0.5rem 0" }}>
        Nå: <span style={{ fontWeight: 600 }}>{wicon(weather.nextHours[0]?.symbol)} {weather.nextHours[0]?.temp?.toFixed(1)}°C</span>
        &nbsp; Vind: {weather.nextHours[0]?.wind} m/s
      </div>
      <div>
        <b>Senere i dag:</b>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: 2 }}>
          {weather.nextHours.slice(1).map(h => (
            <div key={h.time} style={{
              background: "#e8f4ff",
              borderRadius: 8,
              minWidth: 60,
              textAlign: "center",
              fontSize: 14,
              padding: 4
            }}>
              <div>{wicon(h.symbol)}</div>
              <div>{new Date(h.time).getHours()}:00</div>
              <div>{h.temp?.toFixed(1)}°C</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <b>Neste dager:</b>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {weather.nextDays.map(d => (
            <div key={d.date} style={{
              background: "#e4fdea",
              borderRadius: 8,
              minWidth: 68,
              textAlign: "center",
              fontSize: 14,
              padding: 4
            }}>
              <div>{wicon(d.symbol)}</div>
              <div>{d.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// === Nyheter-widget (marquee + RSS) ===
function NyheterWidget({ fylke }) {
  const [nyheter, setNyheter] = useState([]);

  useEffect(() => {
    async function fetchRSS() {
      let url = "https://www.nrk.no/toppsaker.rss";
      // NRK Fylke-RSS
      if (fylke) {
        url = `https://www.nrk.no/${fylke.toLowerCase()}/toppsaker.rss`;
      }
      try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        const parser = new window.DOMParser();
        const xml = parser.parseFromString(data.contents, "text/xml");
        const items = [...xml.querySelectorAll("item")].map(item => ({
          title: item.querySelector("title")?.textContent,
          link: item.querySelector("link")?.textContent
        })).slice(0, 10);
        setNyheter(items);
      } catch {
        setNyheter([]);
      }
    }
    fetchRSS();
  }, [fylke]);

  return (
    <section style={{
      background: "#ecf6fa",
      borderRadius: "1rem",
      padding: "1.2rem 1.1rem",
      minHeight: 80,
      marginBottom: 10,
      boxShadow: "0 2px 8px #aad8ef52"
    }}>
      <b>📰 Siste nyheter:</b>
      <div style={{ overflow: "hidden", whiteSpace: "nowrap", marginTop: 5 }}>
        {nyheter.length === 0 ? (
          <span>Laster nyheter…</span>
        ) : (
          <marquee>
            {nyheter.map((n, i) =>
              <span key={i} style={{ marginRight: 22 }}>
                <a href={n.link} target="_blank" rel="noopener noreferrer">{n.title}</a>
              </span>
            )}
          </marquee>
        )}
      </div>
    </section>
  );
}

// === Arrangement-widget (basert på RSS, eventuelt fallback) ===
function ArrangementWidget({ fylke }) {
  const [arr, setArr] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      // NRK har ikke arrangementer per fylke, men mange kommuner har RSS på sine nettsider.
      // Her er eksempel: Fredrikstad: https://www.fredrikstad.kommune.no/aktuelt/arrangementer/rss/
      let url = "";
      if (fylke && fylke.toLowerCase() === "ostfold") {
        url = "https://www.fredrikstad.kommune.no/aktuelt/arrangementer/rss/";
      }
      try {
        if (url) {
          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
          const data = await res.json();
          const parser = new window.DOMParser();
          const xml = parser.parseFromString(data.contents, "text/xml");
          const items = [...xml.querySelectorAll("item")].map(item => ({
            title: item.querySelector("title")?.textContent,
            link: item.querySelector("link")?.textContent,
            desc: item.querySelector("description")?.textContent
          })).slice(0, 7);
          setArr(items);
        }
      } catch { setArr([]); }
    }
    fetchEvents();
  }, [fylke]);

  return (
    <section style={{
      background: "#e8fff7",
      borderRadius: "1rem",
      padding: "1.2rem 1.1rem",
      minHeight: 120,
      boxShadow: "0 2px 8px #97ffec34"
    }}>
      <b>🎤 Arrangementer i nærheten:</b>
      {arr.length === 0 ? (
        <div style={{ marginTop: 6 }}>Ingen automatisk liste for ditt område ennå.<br />Send inn tips eller <a href="mailto:hub@geocity.no">registrer et arrangement</a>!</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, marginTop: 6 }}>
          {arr.map((a, i) =>
            <li key={i}>
              <a href={a.link} target="_blank" rel="noopener noreferrer">{a.title}</a>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

// === Automatisk geo-lokasjon + fylke fra koordinater (for widgetene) ===
function useGeo() {
  const [lat, setLat] = useState(59.22);
  const [lon, setLon] = useState(10.95);
  const [sted, setSted] = useState("Fredrikstad");
  const [fylke, setFylke] = useState("ostfold");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async pos => {
      setLat(pos.coords.latitude);
      setLon(pos.coords.longitude);

      // Reverse-geocode for å finne sted/fylke (gratis via Nominatim)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const data = await res.json();
        setSted(data.address.city || data.address.town || data.address.village || "Ditt område");
        setFylke(data.address.county?.toLowerCase().replace(" ", "") || "ostfold");
      } catch {}
    });
  }, []);

  return { lat, lon, sted, fylke };
}

// === DASHBOARD GRID ===
export default function HubDashboard() {
  const { lat, lon, sted, fylke } = useGeo();

  return (
    <div style={{
      paddingTop: 22,
      background: "#f5f7fa",
      minHeight: "100vh"
    }}>
      <header style={{
        background: "#1c6868",
        color: "#fff",
        padding: "1rem 2rem",
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontSize: 26,
        fontWeight: 700
      }}>
        <span style={{ fontSize: 32, marginRight: 6 }}>📍</span>
        <span>{sted} HUB</span>
      </header>

      <div style={{
        display: "grid",
        gridTemplateColumns: "370px 1fr 1fr",
        gap: "2rem",
        maxWidth: "1250px",
        margin: "2rem auto"
      }}>
        {/* VENSTRE: Kollektiv */}
        <KollektivWidget lat={lat} lon={lon} />

        {/* MIDT: Vær + Nyheter */}
        <div>
          <VaerWidget lat={lat} lon={lon} placeName={sted} />
          <NyheterWidget fylke={fylke} />
        </div>

        {/* HØYRE: Arrangementer */}
        <div>
          <ArrangementWidget fylke={fylke} />
        </div>
      </div>
    </div>
  );
}
