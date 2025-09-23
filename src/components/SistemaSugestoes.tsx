import React, { useState, useEffect } from 'react';
import { Venda, Pedido } from '../types/Precos';
import './SistemaSugestoes.css';

interface Sugestao {
  id: string;
  tipo: 'estoque' | 'preco' | 'producao' | 'vendas' | 'lucro';
  titulo: string;
  descricao: string;
  impacto: 'alto' | 'medio' | 'baixo';
  acao: string;
  valorEstimado?: number;
  prioridade: number;
}

const SistemaSugestoes: React.FC = () => {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'estoque' | 'preco' | 'producao' | 'vendas' | 'lucro'>('todas');
  const [ordenacao, setOrdenacao] = useState<'prioridade' | 'impacto' | 'tipo'>('prioridade');

  // Gerar dados de exemplo para análise
  const gerarDadosExemplo = () => {
    const vendasExemplo: Venda[] = [];
    const pedidosExemplo: Pedido[] = [];
    
    // Gerar vendas dos últimos 30 dias
    for (let dia = 1; dia <= 30; dia++) {
      const quantidadeVendas = Math.floor(Math.random() * 10) + 1;
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
          data: new Date(2024, 8, dia),
          sabor,
          tipo,
          quantidade,
          precoUnidade,
          precoTotal: quantidade * precoUnidade,
          formaPagamento: ['dinheiro', 'cartao', 'pix'][Math.floor(Math.random() * 3)] as any
        });
      }
    }

    return { vendasExemplo, pedidosExemplo };
  };

  const gerarSugestoes = () => {
    const { vendasExemplo, pedidosExemplo } = gerarDadosExemplo();
    
    // Analisar dados e gerar sugestões
    const novasSugestoes: Sugestao[] = [];

    // Análise de estoque
    const saboresVendidos: { [key: string]: number } = {};
    vendasExemplo.forEach(venda => {
      saboresVendidos[venda.sabor] = (saboresVendidos[venda.sabor] || 0) + venda.quantidade;
    });

    // Sugestão 1: Estoque baixo
    const saborMaisVendido = Object.entries(saboresVendidos)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (saborMaisVendido) {
      novasSugestoes.push({
        id: 'estoque-1',
        tipo: 'estoque',
        titulo: 'Estoque Baixo - ' + saborMaisVendido[0],
        descricao: `O sabor ${saborMaisVendido[0]} é o mais vendido (${saborMaisVendido[1]} unidades/mês) mas tem estoque baixo.`,
        impacto: 'alto',
        acao: 'Aumentar produção de ' + saborMaisVendido[0] + ' em 30%',
        valorEstimado: 1500,
        prioridade: 1
      });
    }

    // Sugestão 2: Preço otimização
    const vendasPorPreco = vendasExemplo.reduce((acc, v) => {
      const faixa = v.precoUnidade < 3 ? 'baixo' : v.precoUnidade < 5 ? 'medio' : 'alto';
      acc[faixa] = (acc[faixa] || 0) + v.quantidade;
      return acc;
    }, {} as { [key: string]: number });

    if (vendasPorPreco.alto > vendasPorPreco.baixo) {
      novasSugestoes.push({
        id: 'preco-1',
        tipo: 'preco',
        titulo: 'Oportunidade de Preço Premium',
        descricao: 'Produtos de preço alto têm boa aceitação. Considere lançar novos sabores premium.',
        impacto: 'medio',
        acao: 'Desenvolver 2 novos sabores premium (R$ 6,00+)',
        valorEstimado: 2500,
        prioridade: 2
      });
    }

    // Sugestão 3: Produção
    const totalVendas = vendasExemplo.reduce((acc, v) => acc + v.quantidade, 0);
    const mediaDiaria = totalVendas / 30;
    
    if (mediaDiaria > 50) {
      novasSugestoes.push({
        id: 'producao-1',
        tipo: 'producao',
        titulo: 'Otimização de Produção',
        descricao: `Média de ${mediaDiaria.toFixed(1)} unidades/dia. Considere aumentar capacidade produtiva.`,
        impacto: 'medio',
        acao: 'Investir em equipamento adicional para aumentar produção em 25%',
        valorEstimado: 5000,
        prioridade: 3
      });
    }

    // Sugestão 4: Vendas
    const vendasPorDia = Array.from({ length: 7 }, (_, i) => {
      const dia = i + 1;
      return vendasExemplo.filter(v => v.data.getDay() === dia).length;
    });
    
    const diaMenorVenda = vendasPorDia.indexOf(Math.min(...vendasPorDia));
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    novasSugestoes.push({
      id: 'vendas-1',
      tipo: 'vendas',
      titulo: 'Oportunidade de Vendas - ' + diasSemana[diaMenorVenda],
      descricao: `${diasSemana[diaMenorVenda]} tem menor volume de vendas. Considere promoções específicas.`,
      impacto: 'baixo',
      acao: 'Criar promoção "Dia da Empada" nas ' + diasSemana[diaMenorVenda] + 's',
      valorEstimado: 800,
      prioridade: 4
    });

    // Sugestão 5: Lucro
    const lucroTotal = vendasExemplo.reduce((acc, v) => acc + v.precoTotal, 0);
    const margemEstimada = lucroTotal * 0.3; // 30% de margem
    
    if (margemEstimada < 2000) {
      novasSugestoes.push({
        id: 'lucro-1',
        tipo: 'lucro',
        titulo: 'Margem de Lucro Baixa',
        descricao: 'Margem de lucro está abaixo do ideal. Analise custos de produção.',
        impacto: 'alto',
        acao: 'Revisar fornecedores e otimizar receitas para reduzir custos em 15%',
        valorEstimado: 3000,
        prioridade: 1
      });
    }

    // Sugestão 6: Sazonalidade
    novasSugestoes.push({
      id: 'vendas-2',
      tipo: 'vendas',
      titulo: 'Preparação para Alta Temporada',
      descricao: 'Fim de ano se aproxima. Prepare estoque para aumento de 40% nas vendas.',
      impacto: 'medio',
      acao: 'Aumentar produção em 40% para dezembro e janeiro',
      valorEstimado: 4000,
      prioridade: 2
    });

    // Sugestão 7: Diversificação
    const saboresUnicos = new Set(vendasExemplo.map(v => v.sabor)).size;
    if (saboresUnicos < 10) {
      novasSugestoes.push({
        id: 'producao-2',
        tipo: 'producao',
        titulo: 'Diversificação de Sabores',
        descricao: `Apenas ${saboresUnicos} sabores diferentes. Diversificar pode aumentar vendas.`,
        impacto: 'baixo',
        acao: 'Desenvolver 3 novos sabores sazonais',
        valorEstimado: 1200,
        prioridade: 5
      });
    }

    setSugestoes(novasSugestoes);
  };

  useEffect(() => {
    gerarSugestoes();
  }, []);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'estoque':
        return '📦';
      case 'preco':
        return '💰';
      case 'producao':
        return '🏭';
      case 'vendas':
        return '📈';
      case 'lucro':
        return '💎';
      default:
        return '💡';
    }
  };

  const getImpactoClass = (impacto: string) => {
    switch (impacto) {
      case 'alto':
        return 'impacto-alto';
      case 'medio':
        return 'impacto-medio';
      case 'baixo':
        return 'impacto-baixo';
      default:
        return '';
    }
  };

  const sugestoesFiltradas = sugestoes
    .filter(s => filtro === 'todas' || s.tipo === filtro)
    .sort((a, b) => {
      switch (ordenacao) {
        case 'prioridade':
          return a.prioridade - b.prioridade;
        case 'impacto':
          const ordemImpacto = { alto: 1, medio: 2, baixo: 3 };
          return ordemImpacto[a.impacto] - ordemImpacto[b.impacto];
        case 'tipo':
          return a.tipo.localeCompare(b.tipo);
        default:
          return 0;
      }
    });

  return (
    <div className="sugestoes-container">
      <div className="sugestoes-header">
        <h1>💡 Sistema de Sugestões Inteligentes</h1>
        <p>Análise baseada nos seus dados de vendas e produção</p>
      </div>

      <div className="sugestoes-filtros">
        <div className="filtro-tipo">
          <label>Filtrar por tipo:</label>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value as any)}>
            <option value="todas">Todas as sugestões</option>
            <option value="estoque">📦 Estoque</option>
            <option value="preco">💰 Preço</option>
            <option value="producao">🏭 Produção</option>
            <option value="vendas">📈 Vendas</option>
            <option value="lucro">💎 Lucro</option>
          </select>
        </div>

        <div className="filtro-ordenacao">
          <label>Ordenar por:</label>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as any)}>
            <option value="prioridade">Prioridade</option>
            <option value="impacto">Impacto</option>
            <option value="tipo">Tipo</option>
          </select>
        </div>
      </div>

      <div className="sugestoes-grid">
        {sugestoesFiltradas.map((sugestao) => (
          <div key={sugestao.id} className={`sugestao-card ${getImpactoClass(sugestao.impacto)}`}>
            <div className="sugestao-header">
              <div className="sugestao-tipo">
                <span className="tipo-icon">{getTipoIcon(sugestao.tipo)}</span>
                <span className="tipo-nome">{sugestao.tipo.toUpperCase()}</span>
              </div>
              <div className="sugestao-prioridade">
                Prioridade #{sugestao.prioridade}
              </div>
            </div>

            <div className="sugestao-content">
              <h3>{sugestao.titulo}</h3>
              <p>{sugestao.descricao}</p>
              
              <div className="sugestao-acao">
                <h4>💡 Ação Recomendada:</h4>
                <p>{sugestao.acao}</p>
              </div>

              {sugestao.valorEstimado && (
                <div className="sugestao-valor">
                  <h4>💰 Impacto Financeiro Estimado:</h4>
                  <p className="valor-positivo">+{formatarMoeda(sugestao.valorEstimado)}</p>
                </div>
              )}

              <div className="sugestao-impacto">
                <span className={`badge-impacto ${getImpactoClass(sugestao.impacto)}`}>
                  Impacto {sugestao.impacto}
                </span>
              </div>
            </div>

            <div className="sugestao-actions">
              <button className="btn-implementar">Implementar</button>
              <button className="btn-detalhes">Ver Detalhes</button>
              <button className="btn-dispensar">Dispensar</button>
            </div>
          </div>
        ))}
      </div>

      {sugestoesFiltradas.length === 0 && (
        <div className="sem-sugestoes">
          <h3>🎉 Nenhuma sugestão encontrada!</h3>
          <p>Seus dados estão otimizados ou não há sugestões para o filtro selecionado.</p>
        </div>
      )}

      <div className="sugestoes-resumo">
        <h3>📊 Resumo das Sugestões</h3>
        <div className="resumo-cards">
          <div className="resumo-card">
            <h4>Total de Sugestões</h4>
            <p>{sugestoes.length}</p>
          </div>
          <div className="resumo-card">
            <h4>Alto Impacto</h4>
            <p>{sugestoes.filter(s => s.impacto === 'alto').length}</p>
          </div>
          <div className="resumo-card">
            <h4>Valor Total Estimado</h4>
            <p>{formatarMoeda(sugestoes.reduce((acc, s) => acc + (s.valorEstimado || 0), 0))}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SistemaSugestoes;
