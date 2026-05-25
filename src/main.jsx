import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { EncounterProvider } from './contexts/EncounterContext.jsx'

class AppErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state={error:null};
  }
  static getDerivedStateFromError(error){
    return {error};
  }
  componentDidCatch(error,info){
    console.error('APPONCOHB runtime error',error,info);
  }
  render(){
    if(this.state.error){
      return (
        <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#EEF2F7',fontFamily:'Georgia,serif',padding:20}}>
          <div style={{maxWidth:680,background:'#fff',border:'2px solid #B91C1C',borderRadius:14,padding:22,boxShadow:'0 8px 24px rgba(15,23,42,.12)'}}>
            <h1 style={{color:'#B91C1C',margin:'0 0 8px',fontSize:22}}>Erro ao abrir o APPONCOHB</h1>
            <p style={{color:'#334155',fontSize:14,lineHeight:1.5}}>O app foi protegido para não ficar em tela branca. Recarregue a página. Se persistir, envie esta mensagem:</p>
            <pre style={{whiteSpace:'pre-wrap',background:'#F8FAFC',border:'1px solid #CBD5E1',borderRadius:10,padding:12,color:'#1B365D',fontSize:12,maxHeight:260,overflow:'auto'}}>{String(this.state.error?.message||this.state.error)}</pre>
            <button onClick={()=>{try{localStorage.removeItem('dossie_oncologico_atual');}catch(_){} location.reload();}} style={{background:'#B8860B',color:'#fff',border:'none',borderRadius:10,padding:'10px 16px',fontWeight:900,cursor:'pointer'}}>Limpar dossiê local e recarregar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <EncounterProvider>
        <App />
      </EncounterProvider>
    </AppErrorBoundary>
  </React.StrictMode>
)
