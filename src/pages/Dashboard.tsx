import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { DashboardAnalytics, Venda, Pedido } from '../types/Precos';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'ano'>('mes');

  // Carregar dados reais do Firebase
  const carregarDadosReais = async () => {
    try {
      // Buscar dados de contagem diária
      const contagemQuery = query(
        collection(db, 'contagem_diaria'),
        orderBy('data', 'desc')
      );
      const contagemSnapshot = await getDocs(contagemQuery);
      
      // Buscar pedidos
      const pedidosQuery = query(
        collection(db, 'pedidos'),
        orderBy('data', 'desc')
      );
      const pedidosSnapshot = await getDocs(pedidosQuery);
      
      const vendasReais: Venda[] = [];
      const pedidosReais: Pedido[] = [];
      
      // Processar dados de contagem para gerar vendas
      contagemSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.itens && data.resumo && data.resumo.vendasDia > 0) {
          data.itens.forEach((item: any) => {
            if (item.sabor) {
              // Calcular vendas por sabor baseado na proporção
              const totalEmpadas = data.resumo.totalEmpadas || 1;
              const proporcaoVendas = (item.freezer + item.estufa - item.perdas) / totalEmpadas;
              const vendasSabor = Math.round(data.resumo.vendasDia * proporcaoVendas);
              
              if (vendasSabor > 0) {
                // Preços de venda
                const precosVenda: { [key: string]: { empada: number; empadao: number } } = {
                  '4 Queijos': { empada: 2.59, empadao: 0 },
                  'Bacalhau': { empada: 2.99, empadao: 0 },
                  'Banana': { empada: 2.29, empadao: 0 },
                  'Calabresa': { empada: 2.49, empadao: 0 },
                  'Camarão': { empada: 3.14, empadao: 7.07 },
                  'Camarão com Requeijão': { empada: 3.24, empadao: 0 },
                  'Carne Seca': { empada: 3.54, empadao: 6.97 },
                  'Carne Seca com Requeijão': { empada: 3.44, empadao: 0 },
                  'Chocolate': { empada: 2.85, empadao: 0 },
                  'Frango': { empada: 2.29, empadao: 4.02 },
                  'Frango com Ameixa e Bacon': { empada: 3.24, empadao: 0 },
                  'Frango com Azeitona': { empada: 2.99, empadao: 5.27 },
                  'Frango com Bacon': { empada: 2.99, empadao: 0 },
                  'Frango com Cheddar': { empada: 2.59, empadao: 0 },
                  'Frango com Palmito': { empada: 2.99, empadao: 0 },
                  'Frango com Requeijão': { empada: 2.49, empadao: 4.32 },
                  'Palmito': { empada: 3.09, empadao: 0 },
                  'Pizza': { empada: 2.39, empadao: 0 },
                  'Queijo': { empada: 2.69, empadao: 0 },
                  'Queijo com Alho': { empada: 2.85, empadao: 0 },
                  'Queijo com Cebola': { empada: 2.49, empadao: 0 },
                  'Romeu e Julieta': { empada: 2.99, empadao: 0 }
                };
                
                const tipoProduto = data.resumo.tipoProduto || 'empada';
                const precoUnidade = precosVenda[item.sabor]?.[tipoProduto as keyof typeof precosVenda[string]] || 2.59;
                
                vendasReais.push({
                  id: `${doc.id}-${item.sabor}`,
                  data: data.data ? new Date(data.data) : new Date(),
                  sabor: item.sabor,
                  tipo: tipoProduto.toUpperCase() as 'EMPADA' | 'EMPADÃO',
                  quantidade: vendasSabor,
                  precoUnidade,
                  precoTotal: vendasSabor * precoUnidade,
                  formaPagamento: 'dinheiro'
                });
              }
            }
          });
        }
      });
      
      // Processar pedidos reais
      pedidosSnapshot.docs.forEach(doc => {
        const pedidoData = doc.data();
        pedidosReais.push({
          id: doc.id,
          ...pedidoData,
          data: pedidoData.data.toDate()
        } as Pedido);
      });
      
      return { vendasReais, pedidosReais };
    } catch (error) {
      console.error('Erro ao carregar dados reais:', error);
      return { vendasReais: [], pedidosReais: [] };
    }
  };

  const calcularAnalytics = async () => {
    const { vendasReais, pedidosReais } = await carregarDadosReais();
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);

    // Vendas de hoje
    const vendasHoje = vendasReais
      .filter(v => v.data.toDateString() === hoje.toDateString())
      .reduce((acc, v) => acc + v.precoTotal, 0);

    // Vendas do mês
    const vendasMes = vendasReais
      .filter(v => v.data >= inicioMes)
      .reduce((acc, v) => acc + v.precoTotal, 0);

    // Vendas do ano
    const vendasAno = vendasReais
      .filter(v => v.data >= inicioAno)
      .reduce((acc, v) => acc + v.precoTotal, 0);

    // Lucro do mês (baseado em pedidos reais)
    const pedidosMes = pedidosReais
      .filter(p => p.data >= inicioMes)
      .reduce((acc, p) => acc + p.precoTotal, 0);
    const lucroMes = vendasMes - pedidosMes;

    // Top 5 sabores
    const sabores: { [key: string]: { quantidade: number; valor: number } } = {};
    vendasReais.forEach(venda => {
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
