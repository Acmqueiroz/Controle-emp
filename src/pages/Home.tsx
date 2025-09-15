// src/pages/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Dashboard - Resumo Geral</h1>

      {/* Acesso rápido aos menus */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <Link to="/contagem">
          <button>Contagem Diária</button>
        </Link>
        <Link to="/semana">
          <button>Resumo da Semana</button>
        </Link>
        <Link to="/mes">
          <button>Resumo do Mês</button>
        </Link>
        <Link to="/pagamentos">
          <button>Pagamentos</button>
        </Link>
        <Link to="/custos">
          <button>Custos</button>
        </Link>
      </div>

      {/* Resumo de informações */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div style={cardStyle}>
          <h3>Saldo Atual</h3>
          <p>🧊 Freezer: 320</p>
          <p>🔥 Estufa: 85</p>
          <p>💥 Perdas: 12</p>
        </div>

        <div style={cardStyle}>
          <h3>Vendas do Dia</h3>
          <p>🥧 Total Vendido: 70 empadas</p>
          <p>🧾 Faturamento: R$ 350,00</p>
        </div>

        <div style={cardStyle}>
          <h3>Pedido em Trânsito</h3>
          <p>📦 Chegada esperada: Segunda-feira</p>
          <p>📋 Total Caixas: 12</p>
          <p>🥧 Total Empadas: 216</p>
        </div>

        <div style={cardStyle}>
          <h3>Resumo do Mês</h3>
          <p>📊 Empadas vendidas: 1.350</p>
          <p>💸 Receita estimada: R$ 6.750,00</p>
        </div>
      </div>
    </div>
  );
};

// Estilo base dos cards
const cardStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '20px',
  width: '250px',
  backgroundColor: '#f9f9f9',
  color: '#333', // <-- cor do texto ajustada para tema claro dentro do card
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};


export default Home;
