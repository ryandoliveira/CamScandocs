import React from 'react';
import Navbar from './Components/Navbar';
import Scanner from './Components/Scanner';
import ThemeToggle from './Components/ThemeToggle';

function App() {
  return (
    <>
      <Navbar />
      <ThemeToggle />
      <header id="home" className="text-center text-light py-5 mb-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div className="container">
          <h1 className="display-4">Bem vindo ao DocScan</h1>
          <p className="lead">Escaneie seus documentos com IA e use o modelo em alta resolução</p>
        </div>
      </header>
      <div className="container">
        <Scanner />
      </div>
      <footer className="text-center text-muted py-3">
        © 2025 DocScan • Built with React, Bootstrap AND angry
      </footer>
    </>
  );
}

export default App;
