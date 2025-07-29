import { useEffect, useState } from 'react';

const weatherTypes = {
  0: { text: "Klar himmel", emoji: "☀️" },
  1: { text: "Hovedsakelig klar", emoji: "🌤️" },
  2: { text: "Delvis skyet", emoji: "⛅" },
  3: { text: "Overskyet", emoji: "☁️" },
  45: { text: "Tåke", emoji: "🌫️" },
  48: { text: "Is-tåke", emoji: "🌫️" },
  51: { text: "Yr", emoji: "🌦️" },
  53: { text: "Lett yr", emoji: "🌦️" },
  55: { text: "Kraftig yr", emoji: "🌧️" },
  61: { text: "Regnbyger", emoji: "🌧️" },
  63: { text: "Regn", emoji: "🌧️" },
  65: { text: "Kraftig regn", emoji: "🌧️" },
  71: { text: "Snø", emoji: "🌨️" },
  73: { text: "Sludd", emoji: "🌨️" },
  75: { text: "Kraftig snø", emoji: "❄️" },
  80: { text: "Regnbyger", emoji: "🌦️" },
  81: { text: "Kraftige regnbyger", emoji: "🌧️" },
  82: { text: "Voldsomt regn", emoji: "⛈️" },
  95: { text: "Tordenvær", emoji: "⛈️" },
  96: { text: "Tordenvær med sludd", emoji: "⛈️" },
  99: { text: "Tordenvær med hagl", emoji: "⛈️" }
};

export default function Home() {
  const [weatherNow, setWeatherNow] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);

  useEffect(() => {
    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=59.218&longitude=10.929&current_weather=true&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto'
    )
      .then(res => res.json())
      .then(data => {
        setWeatherNow(data.current_weather);

        // Neste 8 timer fra nå
        const now = new Date();
        const times = data.hourly.time;
        const nextHours = [];
        for (let i = 0; i < times.length; i++) {
          const t = new Date(times[i]);
          if (t > now && nextHours.length < 8) {
            nextHours.push({
              time: t,
              temp: data.hourly.temperature_2m[i],
              code: data.hourly.weathercode[i]
            });
          }
        }
        setHourly(nextHours);

        // Neste dager
        const nextDays = [];
        for (let i = 0; i < data.daily.time.length; i++) {
          nextDays.push({
            date: new Date(data.daily.time[i]),
            tmin: data.daily.temperature_2m_min[i],
            tmax: data.daily.temperature_2m_max[i],
            code: data.daily.weathercode[i]
          });
        }
        setDaily(nextDays);
      })
      .catch(() => {
        setWeatherNow(null);
        setHourly([]);
        setDaily([]);
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f3f4f6',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Styling for én-linje værkort */}
      <style>{`
        .weather-flex-row {
          display: flex;
          flex-wrap: nowrap;
          gap: 1.2rem;
          margin-top: 0.7rem;
          width: 100%;
          justify-content: center;
        }
        .weather-card {
          flex: 1 1 0;
          min-width: 80px;
          max-width: 120px;
          background: #e0f2fe;
          border-radius: 1rem;
          padding: 1rem 0.6rem;
          text-align: center;
          box-shadow: 0 2px 8px #e0f2fe44;
          transition: transform 0.12s, box-shadow 0.12s;
          cursor: pointer;
        }
        .weather-card:hover {
          transform: translateY(-4px) scale(1.06);
          box-shadow: 0 6px 16px #0ea5e944;
          background: #bae6fd;
        }
        .weather-card.daily {
          background: #d1fae5;
        }
        .weather-card.daily:hover {
          background: #bbf7d0;
        }
        @media (max-width: 900px) {
          .weather-flex-row {
            gap: 0.6rem;
          }
          .weather-card {
            min-width: 60px;
            padding: 0.6rem 0.2rem;
            font-size: 0.92rem;
          }
        }
        @media (max-width: 700px) {
          .weather-flex-row {
            flex-wrap: wrap;
          }
        }
      `}</style>
      <header style={{
        background: '#115e59',
        color: 'white',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Fredrikstad HUB</h1>
      </header>
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem'
      }}>
        <section style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '950px',
          width: '100%',
          boxShadow: '0 2px 8px #c7f5e2',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🌦️ Værmelding for Fredrikstad</h2>
          {weatherNow ? (
            <>
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Nå: {weatherTypes[weatherNow.weathercode]?.emoji} {weatherTypes[weatherNow.weathercode]?.text || "Ukjent"}<br />
                Temperatur: {weatherNow.temperature}°C<br />
                Vind: {weatherNow.windspeed} m/s
              </div>
              <div style={{ marginBottom: '1.2rem' }}>
                <b>De neste timene:</b>
                <div className="weather-flex-row">
                  {hourly.map((h, i) => (
                    <div key={i} className="weather-card">
                      <div style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>{weatherTypes[h.code]?.emoji || "❔"}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.15rem' }}>{h.temp}°C</div>
                      <div style={{ fontSize: '0.97rem', color: "#334155", marginTop: '0.25rem' }}>
                        {h.time.getHours()}:00
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <b>De neste dagene:</b>
                <div className="weather-flex-row">
                  {daily.map((d, i) => (
                    <div key={i} className="weather-card daily">
                      <div style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>{weatherTypes[d.code]?.emoji || "❔"}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {d.tmin}–{d.tmax}°C
                      </div>
                      <div style={{ fontSize: '0.92rem', color: "#334155", marginTop: '0.22rem' }}>
                        {d.date.toLocaleDateString('nb-NO', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p>Laster værdata...</p>
          )}
        </section>
        <section style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '700px',
          width: '100%',
          boxShadow: '0 2px 8px #c7f5e2'
        }}>
          <h2>Hva ønsker du å se på forsiden?</h2>
          <ul>
            <li>📰 Siste nyheter</li>
            <li>🗺️ Arrangementer og aktiviteter</li>
            <li>🚦 Trafikk og kollektiv</li>
            <li>💬 Kontakt/skjema</li>
          </ul>
        </section>
      </main>
      <footer style={{
        background: '#334155',
        color: 'white',
        padding: '1rem',
        textAlign: 'center',
        borderTopLeftRadius: '1rem',
        borderTopRightRadius: '1rem'
      }}>
        <p>© 2025 Fredrikstad HUB</p>
      </footer>
    </div>
  );
}
