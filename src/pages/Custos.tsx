import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Venda, Pedido, PrecoProduto } from '../types/Precos';
import TabelaPrecos from '../components/TabelaPrecos';
import './Custos.css';

const Custos: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [precos, setPrecos] = useState<PrecoProduto[]>([]);
  const [filtroData, setFiltroData] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fim: new Date()
  });
  const [mostrarTabelaPrecos, setMostrarTabelaPrecos] = useState(false);

  // Carregar dados do Firebase
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar pedidos do Firebase
        const pedidosQuery = query(
          collection(db, 'pedidos'),
          orderBy('data', 'desc')
        );
        const pedidosSnapshot = await getDocs(pedidosQuery);
        const pedidosData: Pedido[] = pedidosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          data: doc.data().data.toDate()
        } as Pedido));

        setPedidos(pedidosData);

        // Carregar vendas reais baseadas nos dados de contagem diária
        const vendasReais: Venda[] = [];
        
        // Buscar dados de contagem diária para calcular vendas reais
        const contagemQuery = query(
          collection(db, 'contagem_diaria'),
          orderBy('data', 'desc')
        );
        const contagemSnapshot = await getDocs(contagemQuery);
        
        contagemSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.itens && data.resumo) {
            data.itens.forEach((item: any) => {
              if (item.sabor && data.resumo.vendasDia > 0) {
                // Calcular vendas por sabor baseado na proporção
                const totalEmpadas = data.resumo.totalEmpadas || 1;
                const proporcaoVendas = (item.freezer + item.estufa - item.perdas) / totalEmpadas;
                const vendasSabor = Math.round(data.resumo.vendasDia * proporcaoVendas);
                
                if (vendasSabor > 0) {
                  // Preços de venda (diferentes dos preços de custo)
                  const precosVenda: { [key: string]: { empada: number; empadao: number } } = {
                    '4 Queijos': { empada: 2.75, empadao: 0 },
                    'Bacalhau': { empada: 2.75, empadao: 0 },
                    'Banana': { empada: 2.40, empadao: 0 },
                    'Calabresa': { empada: 2.58, empadao: 0 },
                    'Camarão': { empada: 3.14, empadao: 7.07 },
                    'Camarão com Requeijão': { empada: 3.24, empadao: 0 },
                    'Carne Seca': { empada: 3.54, empadao: 6.97 },
                    'Carne Seca com Requeijão': { empada: 3.44, empadao: 0 },
                    'Chocolate': { empada: 2.85, empadao: 0 },
                    'Frango': { empada: 2.59, empadao: 5.00 },
                    'Frango com Ameixa e Bacon': { empada: 3.07, empadao: 0 },
                    'Frango com Azeitona': { empada: 2.95, empadao: 5.63 },
                    'Frango com Bacon': { empada: 2.99, empadao: 0 },
                    'Frango com Cheddar': { empada: 2.75, empadao: 0 },
                    'Frango com Palmito': { empada: 2.99, empadao: 0 },
                    'Frango com Requeijão': { empada: 2.69, empadao: 5.10 },
                    'Palmito': { empada: 3.09, empadao: 0 },
                    'Pizza': { empada: 2.39, empadao: 0 },
                    'Queijo': { empada: 4.02, empadao: 0 },
                    'Queijo com Alho': { empada: 3.77, empadao: 0 },
                    'Queijo com Cebola': { empada: 2.69, empadao: 0 },
                    'Romeu e Julieta': { empada: 3.31, empadao: 0 }
                  };
                  
                  const tipoProduto = data.resumo.tipoProduto || 'empada';
                  const precoUnidade = precosVenda[item.sabor]?.[tipoProduto as 'empada' | 'empadao'] || 2.59;
                  
                  vendasReais.push({
                    id: `${doc.id}-${item.sabor}`,
                    data: data.data ? new Date(data.data) : new Date(),
                    sabor: item.sabor,
                    tipo: tipoProduto.toUpperCase() as 'EMPADA' | 'EMPADÃO',
                    quantidade: vendasSabor,
                    precoUnidade,
                    precoTotal: vendasSabor * precoUnidade,
                    formaPagamento: 'dinheiro' // Padrão, pode ser expandido
                  });
                }
              }
            });
          }
        });

        setVendas(vendasReais);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Em caso de erro, usar dados de exemplo
        setPedidos([]);
        setVendas([]);
      }
    };

    carregarDados();
  }, []);

  const calcularTotais = () => {
    const vendasFiltradas = vendas.filter(v => 
      v.data >= filtroData.inicio && v.data <= filtroData.fim
    );
    const pedidosFiltrados = pedidos.filter(p => 
      p.data >= filtroData.inicio && p.data <= filtroData.fim
    );

    const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.precoTotal, 0);
    const totalPedidos = pedidosFiltrados.reduce((acc, p) => acc + p.precoTotal, 0);
    const lucroBruto = totalVendas - totalPedidos;
    const margemLucro = totalVendas > 0 ? (lucroBruto / totalVendas) * 100 : 0;

    return {
      totalVendas,
      totalPedidos,
      lucroBruto,
      margemLucro,
      quantidadeVendas: vendasFiltradas.reduce((acc, v) => acc + v.quantidade, 0),
      quantidadePedidos: pedidosFiltrados.reduce((acc, p) => acc + p.quantidade, 0)
    };
  };

  const getSaboresMaisVendidos = () => {
    const vendasFiltradas = vendas.filter(v => 
      v.data >= filtroData.inicio && v.data <= filtroData.fim
    );

    const sabores: { [key: string]: { quantidade: number; valor: number } } = {};
    
    vendasFiltradas.forEach(venda => {
      if (!sabores[venda.sabor]) {
        sabores[venda.sabor] = { quantidade: 0, valor: 0 };
      }
      sabores[venda.sabor].quantidade += venda.quantidade;
      sabores[venda.sabor].valor += venda.precoTotal;
    });

    return Object.entries(sabores)
      .map(([sabor, dados]) => ({ sabor, ...dados }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const totais = calcularTotais();
  const saboresTop = getSaboresMaisVendidos();

  return (
    <div className="custos-container">
      <div className="custos-header">
        <h1>Controle de Custos</h1>
        <div className="custos-actions">
          <button 
            className="btn-tabela-precos"
            onClick={() => setMostrarTabelaPrecos(!mostrarTabelaPrecos)}
          >
            {mostrarTabelaPrecos ? 'Ocultar' : 'Ver'} Tabela de Preços
          </button>
          <button className="btn-adicionar-venda">+ Nova Venda</button>
          <button className="btn-adicionar-pedido">+ Novo Pedido</button>
        </div>
      </div>

      {mostrarTabelaPrecos && (
        <div className="tabela-precos-section">
          <TabelaPrecos />
        </div>
      )}

      <div className="filtros-section">
        <h3>Filtros de Período</h3>
        <div className="filtros">
          <div className="filtro-item">
            <label>Data Início:</label>
            <input
              type="date"
              value={filtroData.inicio.toISOString().split('T')[0]}
              onChange={(e) => setFiltroData(prev => ({
                ...prev,
                inicio: new Date(e.target.value)
              }))}
            />
          </div>
          <div className="filtro-item">
            <label>Data Fim:</label>
            <input
              type="date"
              value={filtroData.fim.toISOString().split('T')[0]}
              onChange={(e) => setFiltroData(prev => ({
                ...prev,
                fim: new Date(e.target.value)
              }))}
            />
          </div>
        </div>
      </div>

      <div className="resumo-financeiro">
        <h3>Resumo Financeiro</h3>
        <div className="cards-resumo">
          <div className="card">
            <h4>Total de Vendas</h4>
            <p className="valor-positivo">{formatarMoeda(totais.totalVendas)}</p>
            <small>{totais.quantidadeVendas} unidades</small>
          </div>
          <div className="card">
            <h4>Total de Pedidos</h4>
            <p className="valor-negativo">{formatarMoeda(totais.totalPedidos)}</p>
            <small>{totais.quantidadePedidos} unidades</small>
          </div>
          <div className="card">
            <h4>Lucro Bruto</h4>
            <p className={totais.lucroBruto >= 0 ? 'valor-positivo' : 'valor-negativo'}>
              {formatarMoeda(totais.lucroBruto)}
            </p>
            <small>Margem: {totais.margemLucro.toFixed(1)}%</small>
          </div>
        </div>
      </div>

      <div className="sabores-mais-vendidos">
        <h3>Top 5 Sabores Mais Vendidos</h3>
        <div className="lista-sabores">
          {saboresTop.map((item, index) => (
            <div key={index} className="item-sabor">
              <div className="posicao">#{index + 1}</div>
              <div className="info-sabor">
                <h4>{item.sabor}</h4>
                <p>{item.quantidade} unidades - {formatarMoeda(item.valor)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="tabelas-detalhadas">
        <div className="tabela-vendas">
          <h3>Vendas Recentes</h3>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Sabor</th>
                <th>Tipo</th>
                <th>Qtd</th>
                <th>Valor Unit.</th>
                <th>Total</th>
                <th>Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {vendas
                .filter(v => v.data >= filtroData.inicio && v.data <= filtroData.fim)
                .slice(0, 10)
                .map(venda => (
                  <tr key={venda.id}>
                    <td>{venda.data.toLocaleDateString('pt-BR')}</td>
                    <td>{venda.sabor}</td>
                    <td>{venda.tipo}</td>
                    <td>{venda.quantidade}</td>
                    <td>{formatarMoeda(venda.precoUnidade)}</td>
                    <td>{formatarMoeda(venda.precoTotal)}</td>
                    <td>{venda.formaPagamento}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="tabela-pedidos">
          <h3>Pedidos Recentes</h3>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Sabor</th>
                <th>Tipo</th>
                <th>Qtd</th>
                <th>Valor Unit.</th>
                <th>Total</th>
                <th>Fornecedor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pedidos
                .filter(p => p.data >= filtroData.inicio && p.data <= filtroData.fim)
                .slice(0, 10)
                .map(pedido => (
                  <tr key={pedido.id}>
                    <td>{pedido.data.toLocaleDateString('pt-BR')}</td>
                    <td>{pedido.sabor}</td>
                    <td>{pedido.tipo}</td>
                    <td>{pedido.quantidade}</td>
                    <td>{formatarMoeda(pedido.precoUnidade)}</td>
                    <td>{formatarMoeda(pedido.precoTotal)}</td>
                    <td>{pedido.fornecedor}</td>
                    <td>
                      <span className={`status ${pedido.status}`}>
                        {pedido.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Custos;
