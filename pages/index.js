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

function getCityName(lat, lon) {
  // OpenStreetMap/Nominatim reverse-geocoding
  return fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
    .then(res => res.json())
    .then(data => {
      return (
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        data.address?.county ||
        "Ukjent sted"
      );
    })
    .catch(() => "Ukjent sted");
}

export default function Home() {
  const [location, setLocation] = useState({ lat: 59.218, lon: 10.929 }); // Default: Fredrikstad
  const [city, setCity] = useState('Fredrikstad');
  const [weatherNow, setWeatherNow] = useState(null);

  // Hent brukerposisjon og oppdater
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocation({ lat, lon });
          getCityName(lat, lon).then(name => setCity(name));
        },
        () => {}, // Bruker avslår GPS, gjør ingenting (beholder default Fredrikstad)
        { timeout: 7000 }
      );
    }
  }, []);

  // Hent vær for valgt lokasjon
  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true&timezone=auto`
    )
      .then(res => res.json())
      .then(data => {
        setWeatherNow(data.current_weather);
      })
      .catch(() => setWeatherNow(null));
  }, [location]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <style>{`
        .header-bar {
          width: 100%;
          min-height: 76px;
          background: #115e59;
          color: white;
          display: flex;
          align-items: center;
          gap: 1.4rem;
          padding: 0 2.5rem 0 2.5rem;
          box-sizing: border-box;
          font-size: 1.16rem;
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .logo-icon {
          font-size: 2.3rem;
          margin-right: 0.3rem;
        }
        .brand-name {
          font-weight: 800;
          font-size: 1.37rem;
          letter-spacing: 0.8px;
          color: white;
        }
        .gps-box {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #0c4037;
          border-radius: 0.8rem;
          padding: 0.38rem 0.93rem;
          font-size: 1.05rem;
          box-shadow: 0 2px 8px #177;
        }
        .gps-box span {
          font-weight: 600;
          color: #c7f5e2;
        }
        .weather-info-bar {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-left: auto;
          font-size: 1.17rem;
          font-weight: 500;
        }
        .weather-info-bar .emoji {
          font-size: 1.8rem;
          margin-right: 0.23rem;
        }
        .weather-info-bar .temp {
          font-weight: bold;
        }
        @media (max-width: 900px) {
          .header-bar {
            font-size: 0.97rem;
            padding: 0 0.5rem 0 0.5rem;
            gap: 0.6rem;
          }
          .logo-icon {
            font-size: 1.7rem;
            margin-right: 0.2rem;
          }
          .brand-name {
            font-size: 1.05rem;
          }
          .weather-info-bar .emoji {
            font-size: 1.2rem;
          }
        }
        @media (max-width: 700px) {
          .header-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
            min-height: 105px;
            padding: 0.5rem;
          }
          .weather-info-bar {
            margin-left: 0;
            gap: 0.4rem;
            font-size: 1rem;
          }
          .brand-name {
            font-size: 0.9rem;
          }
          .gps-box {
            padding: 0.29rem 0.5rem;
            font-size: 0.93rem;
          }
        }
      `}</style>
      {/* Header/banner */}
      <div className="header-bar">
        {/* Logo */}
        <div className="header-logo">
          <span className="logo-icon" title="GeoCity HUB">📍</span>
          <span className="brand-name">GeoCity HUB</span>
        </div>
        {/* GPS/Byinfo */}
        <div className="gps-box">
          <span>📡</span>
          <span>{city}</span>
        </div>
        {/* Vær-info */}
        <div className="weather-info-bar">
          {weatherNow ? (
            <>
              <span className="emoji">{weatherTypes[weatherNow.weathercode]?.emoji || "❔"}</span>
              <span>{weatherTypes[weatherNow.weathercode]?.text || "Ukjent"}</span>
              <span className="temp">{typeof weatherNow.temperature === "number" ? `| ${weatherNow.temperature}°C` : ""}</span>
              <span style={{ color: "#b6e0db" }}>| Vind: {weatherNow.windspeed} m/s</span>
            </>
          ) : (
            <span>Laster vær...</span>
          )}
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
