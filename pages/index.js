export default function Home() {
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
        <nav>
          {/* Her kan du legge til lenker senere */}
        </nav>
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
          <h2>Velkommen!</h2>
          <p>
            Her finner du alt som er aktuelt i Fredrikstad: vær, trafikk, arrangementer, nyheter og mer!
          </p>
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
            <li>🌦️ Live værmelding</li>
