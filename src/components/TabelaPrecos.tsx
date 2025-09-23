import React, { useState, useEffect } from 'react';
import { PrecoProduto } from '../types/Precos';
import './TabelaPrecos.css';

const TabelaPrecos: React.FC = () => {
  const [precos, setPrecos] = useState<PrecoProduto[]>([]);
  const [mesAtual, setMesAtual] = useState(new Date().toLocaleString('pt-BR', { month: 'long' }).toUpperCase());

  // Dados baseados na tabela da imagem
  const precosIniciais: PrecoProduto[] = [
    // EMPADÕES
    { nome: 'CAMARÃO', tipo: 'EMPADÃO', precoUnidade: 7.07, precoCaixa: 70.70, variacao: 2.17, variacaoTipo: 'aumento' },
    { nome: 'CARNE SECA', tipo: 'EMPADÃO', precoUnidade: 6.97, precoCaixa: 69.70, variacao: 2.20, variacaoTipo: 'aumento' },
    { nome: 'FRANGO', tipo: 'EMPADÃO', precoUnidade: 5.00, precoCaixa: 50.00, variacao: 9.89, variacaoTipo: 'aumento' },
    { nome: 'FRANGO COM AZEITONA', tipo: 'EMPADÃO', precoUnidade: 5.63, precoCaixa: 56.30, variacao: 2.74, variacaoTipo: 'aumento' },
    { nome: 'FRANGO COM REQUEIJÃO', tipo: 'EMPADÃO', precoUnidade: 5.10, precoCaixa: 51.00, variacao: 13.33, variacaoTipo: 'aumento' },
    
    // EMPADAS
    { nome: '4 QUEIJOS', tipo: 'EMPADA', precoUnidade: 2.75, precoCaixa: 49.50, variacao: 2.86, variacaoTipo: 'aumento' },
    { nome: 'BACALHAU', tipo: 'EMPADA', precoUnidade: 2.75, precoCaixa: 49.50, variacao: 3.21, variacaoTipo: 'aumento' },
    { nome: 'BANANA', tipo: 'EMPADA', precoUnidade: 2.40, precoCaixa: 43.20, variacao: 3.00, variacaoTipo: 'aumento' },
    { nome: 'CALABRESA', tipo: 'EMPADA', precoUnidade: 2.58, precoCaixa: 46.35, variacao: 3.00, variacaoTipo: 'aumento' },
    { nome: 'CAMARÃO', tipo: 'EMPADA', precoUnidade: 3.14, precoCaixa: 56.52, variacao: 0.00, variacaoTipo: 'sem_mudanca' },
    { nome: 'CAMARÃO COM REQUEIJÃO', tipo: 'EMPADA', precoUnidade: 3.18, precoCaixa: 57.24, variacao: 0.00, variacaoTipo: 'sem_mudanca' },
    { nome: 'CARNE SECA', tipo: 'EMPADA', precoUnidade: 3.46, precoCaixa: 62.28, variacao: 0.00, variacaoTipo: 'sem_mudanca' },
    { nome: 'CARNE SECA COM REQUEIJÃO', tipo: 'EMPADA', precoUnidade: 3.39, precoCaixa: 61.02, variacao: 0.00, variacaoTipo: 'sem_mudanca' },
    { nome: 'CHOCOLATE', tipo: 'EMPADA', precoUnidade: 2.85, precoCaixa: 51.30, variacao: 3.00, variacaoTipo: 'aumento' },
    { nome: 'FRANGO', tipo: 'EMPADA', precoUnidade: 2.59, precoCaixa: 46.57, variacao: 2.67, variacaoTipo: 'aumento' },
    { nome: 'FRANGO COM AMEIXA E BACON', tipo: 'EMPADA', precoUnidade: 3.07, precoCaixa: 55.26, variacao: 0.00, variacaoTipo: 'sem_mudanca' },
    { nome: 'FRANGO COM AZEITONA', tipo: 'EMPADA', precoUnidade: 2.95, precoCaixa: 53.10, variacao: 3.00, variacaoTipo: 'aumento' },
    { nome: 'FRANGO COM BACON', tipo: 'EMPADA', precoUnidade: 2.95, precoCaixa: 53.10, variacao: 2.87, variacaoTipo: 'aumento' },
    { nome: 'FRANGO COM CHEDDAR', tipo: 'EMPADA', precoUnidade: 2.75, precoCaixa: 49.50, variacao: 2.67, variacaoTipo: 'aumento' },
    { nome: 'FRANGO COM PALMITO', tipo: 'EMPADA', precoUnidade: 2.95, precoCaixa: 53.10, variacao: 3.00, variacaoTipo: 'aumento' },
    { nome: 'FRANGO COM REQUEIJÃO', tipo: 'EMPADA', precoUnidade: 2.69, precoCaixa: 48.42, variacao: 2.67, variacaoTipo: 'aumento' },
    { nome: 'PALMITO', tipo: 'EMPADA', precoUnidade: 3.00, precoCaixa: 54.00, variacao: 3.00, variacaoTipo: 'aumento' },
    { nome: 'PIZZA', tipo: 'EMPADA', precoUnidade: 2.55, precoCaixa: 45.90, variacao: 3.00, variacaoTipo: 'aumento' },
    { nome: 'QUEIJO', tipo: 'EMPADA', precoUnidade: 4.02, precoCaixa: 72.36, variacao: 0.00, variacaoTipo: 'sem_mudanca' },
    { nome: 'QUEIJO COM ALHO', tipo: 'EMPADA', precoUnidade: 3.77, precoCaixa: 67.86, variacao: 0.00, variacaoTipo: 'sem_mudanca' },
    { nome: 'QUEIJO COM CEBOLA', tipo: 'EMPADA', precoUnidade: 2.69, precoCaixa: 48.44, variacao: 3.91, variacaoTipo: 'aumento' },
    { nome: 'ROMEU E JULIETA', tipo: 'EMPADA', precoUnidade: 3.31, precoCaixa: 59.58, variacao: 0.00, variacaoTipo: 'sem_mudanca' },
  ];

  useEffect(() => {
    setPrecos(precosIniciais);
  }, []);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(2)}%`;
  };

  const getVariacaoIcon = (tipo: string) => {
    switch (tipo) {
      case 'aumento':
        return '↗️';
      case 'diminuicao':
        return '↘️';
      default:
        return '➡️';
    }
  };

  const getVariacaoClass = (tipo: string) => {
    switch (tipo) {
      case 'aumento':
        return 'variacao-aumento';
      case 'diminuicao':
        return 'variacao-diminuicao';
      default:
        return 'variacao-sem-mudanca';
    }
  };

  const empadoes = precos.filter(p => p.tipo === 'EMPADÃO');
  const empadas = precos.filter(p => p.tipo === 'EMPADA');

  return (
    <div className="tabela-precos-container">
      <div className="tabela-precos-header">
        <h1>TABELA DE PREÇOS - {mesAtual}</h1>
        <div className="tabela-precos-actions">
          <button className="btn-editar">Editar Preços</button>
          <button className="btn-exportar">Exportar</button>
        </div>
      </div>

      <div className="tabela-precos-content">
        {/* EMPADÕES */}
        <div className="secao-produtos">
          <h2>EMPADÕES</h2>
          <table className="tabela-precos">
            <thead>
              <tr>
                <th>Sabor</th>
                <th>Unidade</th>
                <th>Caixa</th>
                <th>Variação</th>
              </tr>
            </thead>
            <tbody>
              {empadoes.map((produto, index) => (
                <tr key={index}>
                  <td className="sabor">{produto.nome}</td>
                  <td className="preco">{formatarMoeda(produto.precoUnidade)}</td>
                  <td className="preco">{formatarMoeda(produto.precoCaixa)}</td>
                  <td className={`variacao ${getVariacaoClass(produto.variacaoTipo)}`}>
                    {getVariacaoIcon(produto.variacaoTipo)} {formatarPercentual(produto.variacao)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* EMPADAS */}
        <div className="secao-produtos">
          <h2>EMPADAS</h2>
          <table className="tabela-precos">
            <thead>
              <tr>
                <th>Sabor</th>
                <th>Unidade</th>
                <th>Caixa</th>
                <th>Variação</th>
              </tr>
            </thead>
            <tbody>
              {empadas.map((produto, index) => (
                <tr key={index}>
                  <td className="sabor">{produto.nome}</td>
                  <td className="preco">{formatarMoeda(produto.precoUnidade)}</td>
                  <td className="preco">{formatarMoeda(produto.precoCaixa)}</td>
                  <td className={`variacao ${getVariacaoClass(produto.variacaoTipo)}`}>
                    {getVariacaoIcon(produto.variacaoTipo)} {formatarPercentual(produto.variacao)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tabela-precos-footer">
        <p>Dúvidas estamos à disposição.</p>
        <p>Atenciosamente</p>
      </div>
    </div>
  );
};

export default TabelaPrecos;
