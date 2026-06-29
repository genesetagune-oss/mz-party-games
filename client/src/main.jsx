import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error("App error:", err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:"100dvh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, background:"#06070d", color:"#eaecf4", fontFamily:"system-ui,sans-serif", padding:24, textAlign:"center" }}>
          <div style={{ fontSize:40 }}>😵</div>
          <div style={{ fontWeight:800, fontSize:18 }}>Algo correu mal</div>
          <div style={{ fontSize:14, opacity:.55 }}>Recarrega a página para voltar ao menu.</div>
          <button onClick={() => window.location.reload()} style={{ marginTop:8, padding:"12px 28px", borderRadius:12, background:"#00C9A7", border:"none", color:"#000", fontWeight:800, fontSize:15, cursor:"pointer" }}>
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
