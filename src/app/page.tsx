export default function Home() {
  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      maxWidth: '800px', 
      margin: '50px auto', 
      padding: '20px',
      lineHeight: '1.6'
    }}>
      <h1>NetTap API</h1>
      <p>Internet Tariff Comparison Platform - Backend API</p>
      
      <h2>Available Endpoints</h2>
      <ul>
        <li><a href="/api/health" target="_blank">/api/health</a> - Health check</li>
        <li><a href="/api/filters" target="_blank">/api/filters</a> - Available filters</li>
        <li><a href="/api/tariffs" target="_blank">/api/tariffs</a> - Search tariffs</li>
        <li>/api/leads - Create lead (POST)</li>
        <li>/api/admin/leads - Admin endpoints</li>
        <li>/api/isp/leads - ISP endpoints</li>
      </ul>
      
      <h2>Documentation</h2>
      <ul>
        <li><strong>API Reference:</strong> See API.md</li>
        <li><strong>Quick Start:</strong> See QUICKSTART.md</li>
        <li><strong>Implementation:</strong> See IMPLEMENTATION.md</li>
      </ul>
      
      <p style={{ marginTop: '40px', color: '#666' }}>
        Backend-first architecture • Next.js 14 • TypeScript • Repository Pattern
      </p>
    </div>
  );
}
