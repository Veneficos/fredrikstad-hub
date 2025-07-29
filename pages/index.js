import { useEffect, useState } from 'react';

// Mapper fra værkode til tekst og emoji
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
  const [isMobile, setIsMobile] = useState(false);

  // Oppdaterer isMobile når skjermstørrelsen endres
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 700); // Bytt til ønsket breakpoint
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Styles for værkort-rader – endres basert på isMobile
  const rowStyle = isMobile
    ? {
        display: 'flex',
        gap: '1.2rem',
        marginTop: '0.6rem',
        overflowX: 'auto',
        flexWrap: 'nowrap',
        justifyContent: 'flex-start'
      }
    : {
        display: 'flex',
        gap: '1.2rem',
        marginTop: '0.6rem',
        overflowX: 'visible',
        flexWrap: 'nowrap',
        justifyContent: 'center'
      };

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
          maxWidth: '750px',
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
                <div style={rowStyle}>
                  {hourly.map((h, i) => (
                    <div key={i} style={{
                      background: '#e0f2fe',
                      borderRadius: '0.7rem',
                      padding: '0.7rem',
                      textAlign: 'center',
                      minWidth: '70px'
                    }}>
                      <div style={{ fontSize: '1.5rem' }}>{weatherTypes[h.code]?.emoji || "❔"}</div>
                      <div style={{ fontWeight: 'bold' }}>{h.temp}°C</div>
                      <div style={{ fontSize: '0.95rem' }}>
                        {h.time.getHours()}:00
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <b>De neste dagene:</b>
                <div style={{ ...rowStyle, minHeight: 0 }}>
                  {daily.map((d, i) => (
                    <div key={i} style={{
                      background: '#d1fae5',
                      borderRadius: '0.7rem',
                      padding: '0.7rem',
                      textAlign: 'center',
                      minWidth: '100px'
                    }}>
                      <div style={{ fontSize: '1.5rem' }}>{weatherTypes[d.code]?.emoji || "❔"}</div>
                      <div style={{ fontWeight: 'bold' }}>
                        {d.tmin}–{d.tmax}°C
                      </div>
