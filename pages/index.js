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
      background: '#f3f4f6',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <style>{`
        .topbar {
          display: flex;
          align-items: center;
          background: #115e59;
          color: white;
          height: 70px;
          padding: 0 2rem;
          gap: 1rem;
        }
        .logo-icon {
          font-size: 2.2rem;
          margin-right: 0.65rem;
        }
        .brand-name {
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .brand-tag {
          font-size: 0.95rem;
          font-weight: 400;
          color: #b6e0db;
          margin-left: 0.2rem;
        }
        .weather-bar {
          background: #e0f2fe;
          box-shadow: 0 2px 8px #c7f5e2aa;
          padding: 1.1rem 2rem 1.1rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.3rem;
        }
        .weather-main {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }
        .weather-now {
          font-size: 1.17rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .weather-extra {
          font-size: 1rem;
          color: #155e75;
        }
        .weather-row {
          display: flex;
          gap: 1.2rem;
          margin-top: 0.3rem;
        }
        .weather-card {
          flex: 1 1 0;
          min-width: 80px;
          max-width: 120px;
          background: #fff;
          border-radius: 1rem;
          padding: 0.7rem 0.2rem 0.5rem 0.2rem;
          text-align: center;
          box-shadow: 0 2px 8px #e0f2fe44;
          transition: transform 0.11s, box-shadow 0.11s;
          cursor: pointer;
        }
        .weather-card:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 6px 16px #0ea5e944;
          background: #e0f2fe;
        }
        @media (max-width: 800px) {
          .topbar {
            padding: 0 0.7rem;
          }
          .weather-bar {
            padding: 1rem 0.6rem 1rem 0.6rem;
          }
          .weather-row {
            gap: 0.5rem;
          }
          .weather-card {
            min-width: 60px;
            font-size: 0.92rem;
            padding: 0.4rem 0.15rem 0.35rem 0.15rem;
          }
        }
        @media (max-width: 600px) {
          .brand-name {
            font-size: 1.08rem;
          }
          .weather-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.6rem;
          }
          .weather-row {
            flex-wrap: wrap;
            gap: 0.3rem;
          }
        }
      `}</style>

      {/* Top-baren med logo */}
      <div className="topbar">
        <span className="logo-icon" title="GeoCity HUB">📍</span>
        <span className="brand-name">GeoCity <span className="brand-tag">HUB</span></span>
      </div>

      {/* Vær-linje øverst */}
      <div className="weather-bar">
        {weatherNow ? (
          <div className="weather-main">
            <span className="weather-now">
              {weatherTypes[weatherNow.weathercode]?.emoji || "❔"}
              {weatherTypes[weatherNow.weathercode]?.text || "Ukjent"}
              {typeof weatherNow.temperature === "number" && (
                <>| {weatherNow.temperature}°C</>
              )}
            </span>
            <span className="weather-extra">
              Vind: {weatherNow.windspeed} m/s
            </span>
          </div>
        ) : (
          <span className="weather-now">Laster værdata...</span>
        )}

        <div className="weather-row">
          {daily.map((d, i) => (
            <div key={i} className="weather-card">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.15rem' }}>
                {weatherTypes[d.code]?.emoji || "❔"}
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                {d.tmin}–{d.tmax}°C
              </div>
              <div style={{ fontSize: '0.93rem', color: "#334155", marginTop: '0.11rem' }}>
                {d.date.toLocaleDateString('nb-NO', { weekday: 'short', day: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hovedinnhold */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem'
      }}>
        <section style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '700px',
          width: '100%',
          boxShadow: '0 2px 8px #c7f5e2',
          marginBottom: '2rem',
          marginTop: '2rem'
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
        <p>© 2025 GeoCity HUB</p>
      </footer>
    </div>
  );
}
