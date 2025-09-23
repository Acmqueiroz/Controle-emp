// src/pages/Semana.tsx
import React, { useState, useEffect } from 'react';
import { buscarDadosSemana, calcularTotais } from '../services/firebaseService'; // Funções criadas
import { Contagem } from '../types/Contagem'; // Importando o tipo Contagem

const Semana: React.FC = () => {
  const [dadosSemana, setDadosSemana] = useState<Contagem[]>([]); // Usando o tipo Contagem
  const [totais, setTotais] = useState({
    totalFreezer: 0,
    totalEstufa: 0,
    totalPerdas: 0,
    totalEmpadas: 0,
  });

  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1); // Mês atual (1-12)
  const [semana, setSemana] = useState(1); // Começar com a primeira semana do mês (27 a 03)

  // Função para obter o intervalo de datas da semana (27-03)
  const obterDatasSemana = (ano: number, mes: number, semana: number) => {
    const primeiroDiaDaSemana = 27 + (semana - 1) * 7; // Ajustando a data inicial da semana
    const ultimoDiaDaSemana = primeiroDiaDaSemana + 6; // A semana vai de sábado a sexta

    const dataInicio = new Date(ano, mes - 1, primeiroDiaDaSemana); // Calculando a data inicial da semana
    const dataFim = new Date(ano, mes - 1, ultimoDiaDaSemana); // Calculando a data final da semana

    return { dataInicio, dataFim };
  };

  // Função para buscar dados do Firestore com base na semana
  const buscarDadosSemanaFirestore = async () => {
    const { dataInicio, dataFim } = obterDatasSemana(ano, mes, semana);
    const dados = await buscarDadosSemana(dataInicio, dataFim); // Função de busca que você já criou
    setDadosSemana(dados);  // Setando os dados
    const totaisCalculados = calcularTotais(dados);
    setTotais(totaisCalculados);
  };

  // Buscar dados ao carregar a tela
  useEffect(() => {
    buscarDadosSemanaFirestore();
  }, [ano, mes, semana]);

  // Função para navegar para a semana anterior
  const semanaAnterior = () => {
    setSemana(prevSemana => (prevSemana > 1 ? prevSemana - 1 : prevSemana));
  };

  // Função para navegar para a próxima semana
  const proximaSemana = () => {
    setSemana(prevSemana => prevSemana + 1);
  };

  return (
    <div className="container">
      <h1>Resumo da Semana ({27 + (semana - 1) * 7} a {27 + (semana - 1) * 7 + 6})</h1>

      {/* Botões para navegação entre as semanas */}
      <div className="controls">
        <button onClick={semanaAnterior}>Semana Anterior</button>
        <button onClick={proximaSemana}>Próxima Semana</button>
      </div>

      {/* Tabela de resumo */}
      <table className="tabela-resumo">
        <thead>
          <tr>
            <th>Sabor</th>
            <th>Freezer</th>
            <th>Estufa</th>
            <th>Perdas</th>
            <th>Total Empadas</th>
          </tr>
        </thead>
        <tbody>
          {dadosSemana.length > 0 ? (
            dadosSemana.map((item, index) => (
              <tr key={index}>
                <td>{item.sabor}</td>
                <td>{item.freezer}</td>
                <td>{item.estufa}</td>
                <td>{item.perdas}</td>
                <td>{item.freezer + item.estufa - item.perdas}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>Nenhum dado disponível para essa semana.</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td><strong>Total</strong></td>
            <td>{totais.totalFreezer}</td>
            <td>{totais.totalEstufa}</td>
            <td>{totais.totalPerdas}</td>
            <td>{totais.totalEmpadas}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default Semana;
