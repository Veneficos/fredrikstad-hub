import { useEffect, useState } from 'react';

export default function Home() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    // Henter værdata for Fredrikstad (breddegrad 59.218, lengdegrad 10.929)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=59.218&longitude=10.929&current_weather=true&hourly=temperature_2m,weathercode')
      .then(res => res.json())
      .then(data => setWeather(data.current_weather))
      .catch(() => setWeather(null));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f3f4f6',
      fontFamily: 'system-ui, sans-serif'
    }}>
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
          maxWidth: '700px',
          width: '100%',
          boxShadow: '0 2px 8px #c7f5e2',
          marginBottom: '2rem'
        }}>
          <h2>🌦️ Live værmelding for Fredrikstad</h2>
          {weather ? (
            <div style={{ fontSize: '1.5rem' }}>
              <p>
                <b>Temperatur:</b> {weather.temperature}°C<br />
                <b>Vind:</b> {weather.windspeed} m/s<br />
                <b>Værkode:</b> {weather.weathercode}
              </p>
              <small>(Oppdatert {new Date(weather.time).toLocaleTimeString()})</small>
            </div>
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
