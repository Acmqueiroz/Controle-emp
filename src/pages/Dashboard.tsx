import React, { useState, useEffect } from 'react';
import { DashboardAnalytics, Venda, Pedido } from '../types/Precos';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'ano'>('mes');

  // Gerar dados de exemplo para demonstração
  const gerarDadosExemplo = () => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);

    // Gerar vendas para o mês
    const vendasExemplo: Venda[] = [];
    for (let dia = 1; dia <= 30; dia++) {
      const quantidadeVendas = Math.floor(Math.random() * 15) + 5;
      for (let i = 0; i < quantidadeVendas; i++) {
        const sabores = ['FRANGO', 'CAMARÃO', 'QUEIJO', 'CARNE SECA', 'PALMITO', 'PIZZA', 'CHOCOLATE'];
        const sabor = sabores[Math.floor(Math.random() * sabores.length)];
        const tipo = Math.random() > 0.7 ? 'EMPADÃO' : 'EMPADA';
        const quantidade = Math.floor(Math.random() * 50) + 1;
        const precoUnidade = tipo === 'EMPADÃO' ? 
          (sabor === 'CAMARÃO' ? 7.07 : sabor === 'CARNE SECA' ? 6.97 : 5.00) :
          (sabor === 'QUEIJO' ? 4.02 : sabor === 'CAMARÃO' ? 3.14 : sabor === 'CHOCOLATE' ? 2.85 : 2.59);
        
        vendasExemplo.push({
          id: `${dia}-${i}`,
          data: new Date(hoje.getFullYear(), hoje.getMonth(), dia),
          sabor,
          tipo,
          quantidade,
          precoUnidade,
          precoTotal: quantidade * precoUnidade,
          formaPagamento: ['dinheiro', 'cartao', 'pix'][Math.floor(Math.random() * 3)] as any
        });
      }
    }

    return vendasExemplo;
  };

  const calcularAnalytics = () => {
    const vendasExemplo = gerarDadosExemplo();
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);

    // Vendas de hoje
    const vendasHoje = vendasExemplo
      .filter(v => v.data.toDateString() === hoje.toDateString())
      .reduce((acc, v) => acc + v.precoTotal, 0);

    // Vendas do mês
    const vendasMes = vendasExemplo
      .filter(v => v.data >= inicioMes)
      .reduce((acc, v) => acc + v.precoTotal, 0);

    // Vendas do ano
    const vendasAno = vendasExemplo
      .filter(v => v.data >= inicioAno)
      .reduce((acc, v) => acc + v.precoTotal, 0);

    // Lucro do mês (simulado)
    const lucroMes = vendasMes * 0.4; // 40% de margem

    // Top 5 sabores
    const sabores: { [key: string]: { quantidade: number; valor: number } } = {};
    vendasExemplo.forEach(venda => {
      if (!sabores[venda.sabor]) {
        sabores[venda.sabor] = { quantidade: 0, valor: 0 };
      }
      sabores[venda.sabor].quantidade += venda.quantidade;
      sabores[venda.sabor].valor += venda.precoTotal;
    });

    const saboresTop5 = Object.entries(sabores)
      .map(([sabor, dados]) => ({ sabor, ...dados }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    // Tendências (simuladas)
    const crescimentoVendas = 12.5; // %
    const crescimentoLucro = 8.3; // %

    // Alertas
    const alertas = [
      {
        tipo: 'estoque_baixo' as const,
        mensagem: 'Estoque de FRANGO baixo - apenas 15 unidades restantes',
        prioridade: 'alta' as const
      },
      {
        tipo: 'lucro_baixo' as const,
        mensagem: 'Margem de lucro abaixo da média esta semana',
        prioridade: 'media' as const
      },
      {
        tipo: 'vendas_baixas' as const,
        mensagem: 'Vendas de hoje 20% abaixo da média',
        prioridade: 'baixa' as const
      }
    ];

    const dashboardData: DashboardAnalytics = {
      vendasHoje,
      vendasMes,
      vendasAno,
      lucroMes,
      saboresTop5,
      tendencias: {
        crescimentoVendas,
        crescimentoLucro
      },
      alertas
    };

    setAnalytics(dashboardData);
  };

  useEffect(() => {
    calcularAnalytics();
  }, [periodo]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'estoque_baixo':
        return '📦';
      case 'lucro_baixo':
        return '💰';
      case 'vendas_baixas':
        return '📉';
      default:
        return '⚠️';
    }
  };

  const getAlertaClass = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'alerta-alta';
      case 'media':
        return 'alerta-media';
      case 'baixa':
        return 'alerta-baixa';
      default:
        return '';
    }
  };

  if (!analytics) {
    return <div className="dashboard-loading">Carregando dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard - Controle Empadas</h1>
        <div className="dashboard-filters">
          <select 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value as any)}
            className="periodo-select"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="ano">Este Ano</option>
          </select>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Cards de Métricas Principais */}
        <div className="metricas-principais">
          <div className="card-metrica vendas-hoje">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Vendas Hoje</h3>
              <p className="valor">{formatarMoeda(analytics.vendasHoje)}</p>
              <small>Receita do dia</small>
            </div>
          </div>

          <div className="card-metrica vendas-mes">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Vendas do Mês</h3>
              <p className="valor">{formatarMoeda(analytics.vendasMes)}</p>
              <small>Receita mensal</small>
            </div>
          </div>

          <div className="card-metrica vendas-ano">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <h3>Vendas do Ano</h3>
              <p className="valor">{formatarMoeda(analytics.vendasAno)}</p>
              <small>Receita anual</small>
            </div>
          </div>

          <div className="card-metrica lucro-mes">
            <div className="card-icon">💎</div>
            <div className="card-content">
              <h3>Lucro do Mês</h3>
              <p className="valor">{formatarMoeda(analytics.lucroMes)}</p>
              <small>Lucro líquido</small>
            </div>
          </div>
        </div>

        {/* Tendências */}
        <div className="tendencias-section">
          <h2>Tendências</h2>
          <div className="cards-tendencias">
            <div className="card-tendencia">
              <h4>Crescimento de Vendas</h4>
              <div className="tendencia-valor positiva">
                +{analytics.tendencias.crescimentoVendas}%
              </div>
              <small>vs. mês anterior</small>
            </div>
            <div className="card-tendencia">
              <h4>Crescimento de Lucro</h4>
              <div className="tendencia-valor positiva">
                +{analytics.tendencias.crescimentoLucro}%
              </div>
              <small>vs. mês anterior</small>
            </div>
          </div>
        </div>

        {/* Top 5 Sabores */}
        <div className="sabores-top-section">
          <h2>Top 5 Sabores Mais Vendidos</h2>
          <div className="lista-sabores-dashboard">
            {analytics.saboresTop5.map((item, index) => (
              <div key={index} className="item-sabor-dashboard">
                <div className="posicao-dashboard">#{index + 1}</div>
                <div className="info-sabor-dashboard">
                  <h4>{item.sabor}</h4>
                  <p>{item.quantidade} unidades vendidas</p>
                  <p className="valor-sabor">{formatarMoeda(item.valor)}</p>
                </div>
                <div className="barra-progresso-dashboard">
                  <div 
                    className="progresso-dashboard"
                    style={{ 
                      width: `${(item.quantidade / analytics.saboresTop5[0].quantidade) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        <div className="alertas-section">
          <h2>Alertas e Notificações</h2>
          <div className="lista-alertas">
            {analytics.alertas.map((alerta, index) => (
              <div key={index} className={`alerta ${getAlertaClass(alerta.prioridade)}`}>
                <div className="alerta-icon">{getAlertaIcon(alerta.tipo)}</div>
                <div className="alerta-content">
                  <p>{alerta.mensagem}</p>
                  <small>Prioridade: {alerta.prioridade}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Vendas por Dia (Simulado) */}
        <div className="grafico-section">
          <h2>Vendas dos Últimos 7 Dias</h2>
          <div className="grafico-barras-dashboard">
            {Array.from({ length: 7 }, (_, i) => {
              const data = new Date();
              data.setDate(data.getDate() - (6 - i));
              const vendasDia = Math.random() * 1000 + 500;
              return (
                <div key={i} className="barra-dia-dashboard">
                  <div 
                    className="barra-vendas-dashboard"
                    style={{ 
                      height: `${(vendasDia / 1500) * 200}px` 
                    }}
                  ></div>
                  <span className="label-dia-dashboard">
                    {data.getDate()}/{data.getMonth() + 1}
                  </span>
                  <span className="valor-dia-dashboard">
                    {formatarMoeda(vendasDia)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumo de Performance */}
        <div className="performance-section">
          <h2>Resumo de Performance</h2>
          <div className="cards-performance">
            <div className="card-performance">
              <h4>Meta Mensal</h4>
              <div className="progresso-meta">
                <div 
                  className="barra-progresso-meta"
                  style={{ width: '75%' }}
                ></div>
              </div>
              <p>75% concluído</p>
            </div>
            <div className="card-performance">
              <h4>Eficiência de Produção</h4>
              <div className="progresso-meta">
                <div 
                  className="barra-progresso-meta"
                  style={{ width: '88%' }}
                ></div>
              </div>
              <p>88% de eficiência</p>
            </div>
            <div className="card-performance">
              <h4>Satisfação do Cliente</h4>
              <div className="progresso-meta">
                <div 
                  className="barra-progresso-meta"
                  style={{ width: '92%' }}
                ></div>
              </div>
              <p>4.6/5.0 estrelas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
