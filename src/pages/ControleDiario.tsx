import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ContagemItem } from '../types/ContagemItem';
import { PrecoProduto } from '../types/Precos';
import './ControleDiario.css';
import { buscarDocumentoAnterior } from '../services/firebaseService';

// Sabores específicos para cada tipo de produto
const SABORES_EMPADA: string[] = [
  '4 Queijos', 'Bacalhau', 'Banana', 'Calabresa', 'Camarão', 'Camarão com Requeijão',
  'Carne Seca', 'Carne Seca com Requeijão', 'Chocolate', 'Frango',
  'Frango com Ameixa e Bacon', 'Frango com Azeitona', 'Frango com Bacon',
  'Frango com Cheddar', 'Frango com Palmito', 'Frango com Requeijão',
  'Palmito', 'Pizza', 'Queijo', 'Queijo com Alho', 'Queijo com Cebola', 'Romeu e Julieta'
];

const SABORES_EMPADAO: string[] = [
  'Camarão', 'Carne Seca', 'Frango', 'Frango com Azeitona', 'Frango com Requeijão'
];

const CAPACIDADE_FREEZER_CAIXAS = 52;
const ITENS_POR_CAIXA = 18;

// Preços baseados na tabela de preços (valores de custo para pedidos)
const PRECOS_PEDIDO: { [key: string]: { empada: number; empadao: number } } = {
  '4 Queijos': { empada: 2.75, empadao: 0 },
  'Bacalhau': { empada: 2.75, empadao: 0 },
  'Banana': { empada: 2.40, empadao: 0 },
  'Calabresa': { empada: 2.58, empadao: 0 },
  'Camarão': { empada: 3.14, empadao: 7.07 },
  'Camarão com Requeijão': { empada: 3.18, empadao: 0 },
  'Carne Seca': { empada: 3.54, empadao: 6.97 },
  'Carne Seca com Requeijão': { empada: 3.39, empadao: 0 },
  'Chocolate': { empada: 2.85, empadao: 0 },
  'Frango': { empada: 2.59, empadao: 5.00 },
  'Frango com Ameixa e Bacon': { empada: 3.07, empadao: 0 },
  'Frango com Azeitona': { empada: 2.95, empadao: 5.63 },
  'Frango com Bacon': { empada: 2.99, empadao: 0 },
  'Frango com Cheddar': { empada: 2.75, empadao: 0 },
  'Frango com Palmito': { empada: 2.99, empadao: 0 },
  'Frango com Requeijão': { empada: 2.69, empadao: 5.10 },
  'Palmito': { empada: 3.00, empadao: 0 },
  'Pizza': { empada: 2.55, empadao: 0 },
  'Queijo': { empada: 4.02, empadao: 0 },
  'Queijo com Alho': { empada: 3.77, empadao: 0 },
  'Queijo com Cebola': { empada: 2.69, empadao: 0 },
  'Romeu e Julieta': { empada: 3.31, empadao: 0 }
};

const numberOrZero = (value: number | '' | undefined): number => {
  return typeof value === 'number' ? value : Number(value) || 0;
};

// Componente para tabela de controle
const TabelaControle: React.FC<{
  tipoProduto: 'empada' | 'empadao';
  sabores: string[];
  linhas: ContagemItem[];
  pedidoCaixas: number[];
  recebidoHoje: (number | '')[];
  saldoAnteriorPorSabor: Record<string, number>;
  mostrarPedido: boolean;
  alterarLinha: (index: number, campo: keyof ContagemItem, valor: number | '') => void;
  alterarPedido: (index: number, valor: number | string) => void;
  alterarRecebido: (index: number, valor: number | string) => void;
  totais: any;
}> = ({ tipoProduto, sabores, linhas, pedidoCaixas, recebidoHoje, saldoAnteriorPorSabor, mostrarPedido, alterarLinha, alterarPedido, alterarRecebido, totais }) => {
  return (
    <table className="tabela-controle">
      <thead>
        <tr>
          <th>Sabor</th>
          <th>Saldo anterior</th>
          <th>Recebido</th>
          <th>Freezer</th>
          <th>Estufa</th>
          <th>Perdas</th>
          <th>Total</th>
          <th>Vendas</th>
          {mostrarPedido && <th>Pedido (caixas)</th>}
          {mostrarPedido && <th>Preço Unit.</th>}
          {mostrarPedido && <th>Valor Total</th>}
          {mostrarPedido && <th>Saldo Previsto</th>}
        </tr>
      </thead>
      <tbody>
        {linhas.map((it, index) => {
          const freezer = numberOrZero(it.freezer);
          const estufa = numberOrZero(it.estufa);
          const perdas = numberOrZero(it.perdas);
          const total = freezer + estufa - perdas;
          const saldoAnt = saldoAnteriorPorSabor[it.sabor] || 0;
          const recebido = typeof recebidoHoje[index] === 'number' ? (recebidoHoje[index] as number) : 0;
          const vendas = Math.max(0, saldoAnt - total);
          const saldoPrevisto = total + (pedidoCaixas[index] || 0) * ITENS_POR_CAIXA;
          const precoUnitario = PRECOS_PEDIDO[it.sabor]?.[tipoProduto] || 0;
          const valorTotalPedido = (pedidoCaixas[index] || 0) * ITENS_POR_CAIXA * precoUnitario;
          
          return (
            <tr key={index}>
              <td>{it.sabor}</td>
              <td><input className="input-ro" readOnly value={saldoAnt} /></td>
              <td>
                <input
                  className="input-editavel no-spinner"
                  type="number"
                  inputMode="numeric"
                  placeholder=""
                  value={recebidoHoje[index]}
                  onChange={(e) => alterarRecebido(index, e.target.value)}
                  min={0}
                  style={{ width: 70 }}
                />
              </td>
              <td>
                <input className="input-editavel no-spinner" type="number" inputMode="numeric" placeholder="" min={0} value={it.freezer} onChange={(e) => {
                  const n = e.currentTarget.valueAsNumber;
                  alterarLinha(index, 'freezer', Number.isNaN(n) ? '' : n);
                }} style={{ width: 70 }} />
              </td>
              <td>
                <input className="input-editavel no-spinner" type="number" inputMode="numeric" placeholder="" min={0} value={it.estufa} onChange={(e) => {
                  const n = e.currentTarget.valueAsNumber;
                  alterarLinha(index, 'estufa', Number.isNaN(n) ? '' : n);
                }} style={{ width: 70 }} />
              </td>
              <td>
                <input className="input-editavel no-spinner" type="number" inputMode="numeric" placeholder="" min={0} value={it.perdas} onChange={(e) => {
                  const n = e.currentTarget.valueAsNumber;
                  alterarLinha(index, 'perdas', Number.isNaN(n) ? '' : n);
                }} style={{ width: 70 }} />
              </td>
              <td><input className="input-ro" readOnly value={total} /></td>
              <td><input className="input-ro" readOnly value={vendas} /></td>
              {mostrarPedido && (
                <>
                  <td>
                    <input className="input-editavel no-spinner" type="number" inputMode="numeric" placeholder="" min={0} value={pedidoCaixas[index]} onChange={(e) => {
                      const n = e.currentTarget.valueAsNumber;
                      alterarPedido(index, Number.isNaN(n) ? '' : n);
                    }} style={{ width: 70 }} />
                  </td>
                  <td>
                    <input className="input-ro" readOnly value={`R$ ${precoUnitario.toFixed(2)}`} />
                  </td>
                  <td>
                    <input className="input-ro" readOnly value={`R$ ${valorTotalPedido.toFixed(2)}`} />
                  </td>
                  <td>
                    <input className="input-ro" readOnly value={saldoPrevisto} />
                  </td>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td><strong>Total</strong></td>
          <td>{totais.totalSaldoAnterior}</td>
          <td>{totais.totalRecebido}</td>
          <td>{totais.totalFreezer}</td>
          <td>{totais.totalEstufa}</td>
          <td>{totais.totalPerdas}</td>
          <td>{totais.totalEmpadas}</td>
          <td>{totais.vendasDia}</td>
          {mostrarPedido && <td>{totais.totalPedido}</td>}
          {mostrarPedido && <td>-</td>}
          {mostrarPedido && <td>R$ {totais.valorTotalPedido.toFixed(2)}</td>}
          {mostrarPedido && <td>{totais.totalPedidoUnidades}</td>}
        </tr>
        <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
          <td><strong>Resumo</strong></td>
          <td colSpan={5}></td>
          <td><strong>Caixas: {totais.totalEmpadasCaixas}</strong></td>
          <td><strong>Valor Vendas: R$ {(totais.vendasDia * 7.00).toFixed(2)}</strong></td>
          {mostrarPedido && <td colSpan={4}></td>}
        </tr>
      </tfoot>
    </table>
  );
};

const ControleDiario: React.FC = () => {
  const [data, setData] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [mostrarPedido, setMostrarPedido] = useState<boolean>(true);
  const [modoEdicao, setModoEdicao] = useState<boolean>(false);
  const [documentoId, setDocumentoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<boolean>(false);

  // Função para calcular totais por tipo de produto
  const calcularTotaisPorTipo = (tipo: 'empada' | 'empadao'): {
    totalFreezer: number;
    totalEstufa: number;
    totalPerdas: number;
    totalEmpadas: number;
    totalEmpadasCaixas: number;
    totalRecebido: number;
    totalSaldoAnterior: number;
    vendasDia: number;
    valorTotalPedido: number;
    totalPedido: number;
    totalPedidoUnidades: number;
  } => {
    const sabores = tipo === 'empada' ? SABORES_EMPADA : SABORES_EMPADAO;
    const inicioIndex = tipo === 'empada' ? 0 : SABORES_EMPADA.length;
    const fimIndex = tipo === 'empada' ? SABORES_EMPADA.length : SABORES_EMPADA.length + SABORES_EMPADAO.length;
    
    const linhasTipo = linhas.slice(inicioIndex, fimIndex);
    const pedidoCaixasTipo = pedidoCaixas.slice(inicioIndex, fimIndex);
    const recebidoHojeTipo = recebidoHoje.slice(inicioIndex, fimIndex);
    
    const totalFreezer = linhasTipo.reduce((acc, it) => acc + numberOrZero(it.freezer), 0);
    const totalEstufa = linhasTipo.reduce((acc, it) => acc + numberOrZero(it.estufa), 0);
    const totalPerdas = linhasTipo.reduce((acc, it) => acc + numberOrZero(it.perdas), 0);
    const totalEmpadas = totalFreezer + totalEstufa - totalPerdas;
    const totalEmpadasCaixas = Math.floor(totalEmpadas / ITENS_POR_CAIXA);
    
    let totalRecebido = 0;
    recebidoHojeTipo.forEach(v => {
      const valor = typeof v === 'number' ? v : (Number(v) || 0);
      totalRecebido += valor;
    });
    const totalSaldoAnterior = sabores.reduce((acc, s) => acc + (saldoAnteriorPorSabor[s] || 0), 0);
    const vendasDia = Math.max(0, totalSaldoAnterior - totalEmpadas);
    
    const valorTotalPedido = pedidoCaixasTipo.reduce((acc, caixas, index) => {
      if (caixas > 0) {
        const sabor = sabores[index];
        const preco = PRECOS_PEDIDO[sabor]?.[tipo] || 0;
        return acc + (caixas * ITENS_POR_CAIXA * preco);
      }
      return acc;
    }, 0);
    
    const totalPedido = pedidoCaixasTipo.reduce((acc, v) => acc + v, 0);
    const totalPedidoUnidades = totalPedido * ITENS_POR_CAIXA;
    
    return {
      totalFreezer,
      totalEstufa,
      totalPerdas,
      totalEmpadas,
      totalEmpadasCaixas,
      totalRecebido,
      totalSaldoAnterior,
      vendasDia,
      valorTotalPedido,
      totalPedido,
      totalPedidoUnidades
    };
  };

  // Calcular totais combinados (Empada + Empadão)
  const calcularTotaisCombinados = () => {
    const totaisEmpada = calcularTotaisPorTipo('empada');
    const totaisEmpadao = calcularTotaisPorTipo('empadao');
    
    return {
      totalSaldoAnterior: totaisEmpada.totalSaldoAnterior + totaisEmpadao.totalSaldoAnterior,
      totalRecebido: totaisEmpada.totalRecebido + totaisEmpadao.totalRecebido,
      vendasDia: totaisEmpada.vendasDia + totaisEmpadao.vendasDia,
      totalFreezer: totaisEmpada.totalFreezer + totaisEmpadao.totalFreezer,
      totalEstufa: totaisEmpada.totalEstufa + totaisEmpadao.totalEstufa,
      totalPerdas: totaisEmpada.totalPerdas + totaisEmpadao.totalPerdas,
      totalEmpadas: totaisEmpada.totalEmpadas + totaisEmpadao.totalEmpadas,
      totalEmpadasCaixas: totaisEmpada.totalEmpadasCaixas + totaisEmpadao.totalEmpadasCaixas,
      totalPedido: totaisEmpada.totalPedido + totaisEmpadao.totalPedido,
      valorTotalPedido: totaisEmpada.valorTotalPedido + totaisEmpadao.valorTotalPedido,
      totalPedidoUnidades: totaisEmpada.totalPedidoUnidades + totaisEmpadao.totalPedidoUnidades
    };
  };

  // Iniciar campos vazios para digitação (incluindo ambos os tipos)
  const [linhas, setLinhas] = useState<ContagemItem[]>([]);
  const [pedidoCaixas, setPedidoCaixas] = useState<number[]>([]);
  const [recebidoHoje, setRecebidoHoje] = useState<(number | '')[]>([]);

  const [saldoAnteriorPorSabor, setSaldoAnteriorPorSabor] = useState<Record<string, number>>({});

  // Função para carregar dados existentes do dia selecionado
  const carregarDadosDoDia = async (dataSelecionada: string) => {
    setCarregando(true);
    try {
      const contagemQuery = query(
        collection(db, 'contagem_diaria'),
        where('data', '==', dataSelecionada)
      );
      const contagemSnapshot = await getDocs(contagemQuery);
      
      if (!contagemSnapshot.empty) {
        const docData = contagemSnapshot.docs[0].data();
        setDocumentoId(contagemSnapshot.docs[0].id);
        setModoEdicao(true);
        
        // Carregar dados existentes
        const todosSabores = [...SABORES_EMPADA, ...SABORES_EMPADAO];
        setLinhas(docData.itens || todosSabores.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
        setPedidoCaixas(docData.pedidoCaixas || todosSabores.map(() => 0));
        setRecebidoHoje(docData.recebidoHoje || todosSabores.map(() => ''));
        
        // Carregar saldo anterior salvo no documento ou do dia anterior
        if (docData.saldoAnteriorPorSabor) {
          setSaldoAnteriorPorSabor(docData.saldoAnteriorPorSabor);
          console.log('Saldo anterior carregado do documento:', docData.saldoAnteriorPorSabor);
        } else {
          await carregarSaldoAnterior(dataSelecionada);
        }
        
        console.log('Dados carregados para edição:', docData);
        console.log('modoEdicao definido como:', true);
      } else {
        // Não existe registro para esta data, carregar dados do dia anterior
        setModoEdicao(false);
        setDocumentoId(null);
        await carregarDadosAnteriores(dataSelecionada);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setModoEdicao(false);
      setDocumentoId(null);
    } finally {
      setCarregando(false);
    }
  };

  // Função para carregar saldo anterior do dia anterior
  const carregarSaldoAnterior = async (dataSelecionada: string) => {
    try {
      // Calcular a data do dia anterior
      const dataAnterior = new Date(dataSelecionada);
      dataAnterior.setDate(dataAnterior.getDate() - 1);
      const dataAnteriorStr = dataAnterior.toISOString().split('T')[0];
      
      console.log('Buscando saldo anterior para o dia:', dataAnteriorStr);
      
      // Buscar dados do dia anterior
      const contagemQuery = query(
        collection(db, 'contagem_diaria'),
        where('data', '==', dataAnteriorStr)
      );
      const contagemSnapshot = await getDocs(contagemQuery);
      
      if (!contagemSnapshot.empty) {
        const docData = contagemSnapshot.docs[0].data();
        const saboresAtuais = [...SABORES_EMPADA, ...SABORES_EMPADAO];
        
        console.log('Dados encontrados do dia anterior:', docData);
        
        // Carregar saldo anterior baseado no saldo previsto do dia anterior (total + pedidos)
        const saldoAnterior: { [key: string]: number } = {};
        if (docData.itens && docData.pedidoCaixas) {
          docData.itens.forEach((item: any, index: number) => {
            if (saboresAtuais.includes(item.sabor)) {
              const freezer = numberOrZero(item.freezer);
              const estufa = numberOrZero(item.estufa);
              const perdas = numberOrZero(item.perdas);
              const total = freezer + estufa - perdas;
              const pedidoCaixas = docData.pedidoCaixas[index] || 0;
              const saldoPrevisto = total + (pedidoCaixas * ITENS_POR_CAIXA);
              saldoAnterior[item.sabor] = saldoPrevisto;
              console.log(`Sabor ${item.sabor}: freezer=${freezer}, estufa=${estufa}, perdas=${perdas}, total=${total}, pedido=${pedidoCaixas} caixas, saldoPrevisto=${saldoPrevisto}`);
            }
          });
        }
        
        setSaldoAnteriorPorSabor(saldoAnterior);
        console.log('Saldo anterior carregado do dia', dataAnteriorStr, ':', saldoAnterior);
      } else {
        // Se não há dados do dia anterior, iniciar com saldo zerado
        setSaldoAnteriorPorSabor({});
        console.log('Nenhum dado encontrado para o dia anterior', dataAnteriorStr);
      }
    } catch (error) {
      console.error('Erro ao carregar saldo anterior:', error);
      setSaldoAnteriorPorSabor({});
    }
  };

  // Função para carregar dados do dia anterior
  const carregarDadosAnteriores = async (dataSelecionada: string) => {
    // Carregar saldo anterior do dia anterior
    await carregarSaldoAnterior(dataSelecionada);
    
    // Inicializar campos vazios para ambos os tipos
    const todosSabores = [...SABORES_EMPADA, ...SABORES_EMPADAO];
    setLinhas(todosSabores.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
    setPedidoCaixas(todosSabores.map(() => 0));
    setRecebidoHoje(todosSabores.map(() => ''));
  };

  useEffect(() => {
    carregarDadosDoDia(data);
  }, [data]);

  // Inicializar campos quando não está em modo de edição
  useEffect(() => {
    if (!modoEdicao && linhas.length === 0) {
      const todosSabores = [...SABORES_EMPADA, ...SABORES_EMPADAO];
      setLinhas(todosSabores.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
      setPedidoCaixas(todosSabores.map(() => 0));
      setRecebidoHoje(todosSabores.map(() => ''));
    }
  }, [modoEdicao, linhas.length]);

  const alterarLinha = (index: number, campo: keyof ContagemItem, valor: number | '') => {
    const coerced = valor === '' ? '' : Number(valor);
    setLinhas((prev) => prev.map((it, i) => (i === index ? { ...it, [campo]: coerced } : it)));
  };

  const alterarPedido = (index: number, valor: number | string) => {
    const coerced = valor === '' ? 0 : Number(valor) || 0;
    setPedidoCaixas((prev) => prev.map((v, i) => (i === index ? coerced : v)));
  };

  const alterarRecebido = (index: number, valor: number | string) => {
    const coerced: number | '' = valor === '' ? '' : Number(valor) || 0;
    setRecebidoHoje((prev) => prev.map((v, i) => (i === index ? coerced : v)));
  };


  const salvar = async () => {
    setCarregando(true);
    try {
      const totaisCombinados = calcularTotaisCombinados();
    const resumo = {
        totalFreezer: totaisCombinados.totalFreezer,
        totalEstufa: totaisCombinados.totalEstufa,
        totalPerdas: totaisCombinados.totalPerdas,
        totalEmpadas: totaisCombinados.totalEmpadas,
        totalPedidoCaixas: totaisCombinados.totalPedido,
      capacidadeFreezerCaixas: CAPACIDADE_FREEZER_CAIXAS,
        capacidadeOcupadaCaixas: Math.floor(totaisCombinados.totalEmpadas / ITENS_POR_CAIXA),
        capacidadeRestanteCaixas: CAPACIDADE_FREEZER_CAIXAS - Math.floor(totaisCombinados.totalEmpadas / ITENS_POR_CAIXA),
        vendasDia: totaisCombinados.vendasDia,
        recebidoUnidades: totaisCombinados.totalRecebido,
        saldoAnteriorUnidades: totaisCombinados.totalSaldoAnterior,
        valorTotalPedido: totaisCombinados.valorTotalPedido,
      };

      // Criar pedidos para o sistema de custos (ambos os tipos)
      const todosSabores = [...SABORES_EMPADA, ...SABORES_EMPADAO];
      const pedidos = pedidoCaixas.map((caixas, index) => {
        if (caixas > 0) {
          const sabor = todosSabores[index];
          const tipoProduto = index < SABORES_EMPADA.length ? 'empada' : 'empadao';
          const preco = PRECOS_PEDIDO[sabor]?.[tipoProduto] || 0;
          const unidades = caixas * ITENS_POR_CAIXA;
          return {
            id: `${data}-${sabor}-${index}`,
            data: new Date(data),
            sabor,
            tipo: tipoProduto.toUpperCase() as 'EMPADA' | 'EMPADÃO',
            quantidade: unidades,
            precoUnidade: preco,
            precoTotal: unidades * preco,
            fornecedor: 'Fornecedor Principal',
            status: 'pendente' as const
          };
        }
        return null;
      }).filter(Boolean);

      if (modoEdicao && documentoId) {
        // Atualizar documento existente
        const docRef = doc(db, 'contagem_diaria', documentoId);
        await updateDoc(docRef, {
          itens: linhas,
          pedidoCaixas,
          recebidoHoje,
          resumo,
          pedidos,
          saldoAnteriorPorSabor,
          dataAtualizacao: new Date()
        });
        alert(`Registro atualizado! ${pedidos.length > 0 ? `Pedido de R$ ${totaisCombinados.valorTotalPedido.toFixed(2)} enviado para controle de custos.` : ''}`);
      } else {
        // Criar novo documento
    const empadasCollection = collection(db, 'contagem_diaria');
    await addDoc(empadasCollection, {
      data,
      itens: linhas,
      pedidoCaixas,
      recebidoHoje,
      resumo,
          pedidos,
          saldoAnteriorPorSabor,
          dataCriacao: new Date()
        });
        alert(`Contagem salva! ${pedidos.length > 0 ? `Pedido de R$ ${totaisCombinados.valorTotalPedido.toFixed(2)} enviado para controle de custos.` : ''}`);
      }

      // Salvar pedidos no sistema de custos (apenas se não estiver editando)
      if (pedidos.length > 0 && !modoEdicao) {
        const pedidosCollection = collection(db, 'pedidos');
        for (const pedido of pedidos) {
          await addDoc(pedidosCollection, pedido);
        }
      }

      // Atualizar estado para modo de edição
      setModoEdicao(true);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar os dados. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const limparDados = () => {
    const todosSabores = [...SABORES_EMPADA, ...SABORES_EMPADAO];
    setLinhas(todosSabores.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
    setPedidoCaixas(todosSabores.map(() => 0));
    setRecebidoHoje(todosSabores.map(() => ''));
    setModoEdicao(false);
    setDocumentoId(null);
  };

  return (
    <div className="container">
      <h1>Controle Diário {modoEdicao && <span style={{ color: '#f39c12', fontSize: '0.8em' }}>(Editando)</span>}</h1>
      {/* Debug: mostrar estado do modoEdicao */}
      {(() => {
        console.log('Estado atual - modoEdicao:', modoEdicao, 'documentoId:', documentoId);
        return null;
      })()}

      <div className="controls" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          Data:
          <input 
            type="date" 
            value={data} 
            onChange={(e) => setData(e.target.value)} 
            disabled={carregando}
          />
        </label>
        <button onClick={() => setMostrarPedido((v) => !v)} disabled={carregando}>
          {mostrarPedido ? 'Ocultar Pedido' : 'Mostrar Pedido'}
        </button>
        {(modoEdicao || linhas.some(linha => linha.freezer !== '' || linha.estufa !== '' || linha.perdas !== '')) && (
          <button onClick={limparDados} style={{ background: '#e74c3c' }} disabled={carregando}>
            Limpar Dados
          </button>
        )}
      </div>

      {carregando && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#3498db' }}>
          Carregando dados...
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, margin: '12px 0' }}>
        {(() => {
          const totaisCombinados = calcularTotaisCombinados();
          return (
            <>
              <ResumoCard titulo="Saldo anterior" valor={`${totaisCombinados.totalSaldoAnterior}`} />
              <ResumoCard titulo="Recebido (unid)" valor={`${totaisCombinados.totalRecebido}`} />
              <ResumoCard titulo="Vendas do dia" destaque valor={`${totaisCombinados.vendasDia}`} />
              <ResumoCard titulo="Freezer" valor={`${totaisCombinados.totalFreezer}`} />
              <ResumoCard titulo="Estufa" valor={`${totaisCombinados.totalEstufa}`} />
              <ResumoCard titulo="Perdas" valor={`${totaisCombinados.totalPerdas}`} />
              <ResumoCard titulo="Total Empadas" valor={`${totaisCombinados.totalEmpadas}`} />
              <ResumoCard titulo="Pedido (caixas)" valor={`${totaisCombinados.totalPedido}`} />
              <ResumoCard titulo="Valor do Pedido" valor={`R$ ${totaisCombinados.valorTotalPedido.toFixed(2)}`} destaque />
              <ResumoCard titulo="Caixas Totais" valor={`${totaisCombinados.totalEmpadasCaixas}`} />
              <ResumoCard titulo="Valor Estimado Vendas" valor={`R$ ${(totaisCombinados.vendasDia * 7.00).toFixed(2)}`} destaque />
            </>
          );
        })()}
      </div>

      {/* Seção Empadas */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#3498db', marginBottom: '10px' }}>🥧 EMPADAS</h2>
        <TabelaControle 
          tipoProduto="empada"
          sabores={SABORES_EMPADA}
          linhas={linhas.filter((_, index) => index < SABORES_EMPADA.length)}
          pedidoCaixas={pedidoCaixas.slice(0, SABORES_EMPADA.length)}
          recebidoHoje={recebidoHoje.slice(0, SABORES_EMPADA.length)}
          saldoAnteriorPorSabor={saldoAnteriorPorSabor}
          mostrarPedido={mostrarPedido}
          alterarLinha={alterarLinha}
          alterarPedido={alterarPedido}
          alterarRecebido={alterarRecebido}
          totais={calcularTotaisPorTipo('empada')}
        />
      </div>

      {/* Seção Empadões */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>🥟 EMPADÕES</h2>
        <TabelaControle 
          tipoProduto="empadao"
          sabores={SABORES_EMPADAO}
          linhas={linhas.slice(SABORES_EMPADA.length)}
          pedidoCaixas={pedidoCaixas.slice(SABORES_EMPADA.length)}
          recebidoHoje={recebidoHoje.slice(SABORES_EMPADA.length)}
          saldoAnteriorPorSabor={saldoAnteriorPorSabor}
          mostrarPedido={mostrarPedido}
          alterarLinha={(index, campo, valor) => alterarLinha(index + SABORES_EMPADA.length, campo, valor)}
          alterarPedido={(index, valor) => alterarPedido(index + SABORES_EMPADA.length, valor)}
          alterarRecebido={(index, valor) => alterarRecebido(index + SABORES_EMPADA.length, valor)}
          totais={calcularTotaisPorTipo('empadao')}
        />
      </div>

      {/* Tabela original comentada - substituída pelas seções acima */}
      {/* 
      <table className="tabela-controle">
        <thead>
          <tr>
            <th>Sabor</th>
            <th>Saldo anterior</th>
            <th>Recebido</th>
            <th>Freezer</th>
            <th>Estufa</th>
            <th>Perdas</th>
            <th>Total</th>
            <th>Vendas</th>
            {mostrarPedido && <th>Pedido (caixas)</th>}
            {mostrarPedido && <th>Preço Unit.</th>}
            {mostrarPedido && <th>Valor Total</th>}
            {mostrarPedido && <th>Saldo Previsto</th>}
          </tr>
        </thead>
        <tbody>
          {linhas.map((it, index) => {
            const freezer = numberOrZero(it.freezer);
            const estufa = numberOrZero(it.estufa);
            const perdas = numberOrZero(it.perdas);
            const total = freezer + estufa - perdas;
            const saldoAnt = saldoAnteriorPorSabor[it.sabor] || 0;
            const recebido = typeof recebidoHoje[index] === 'number' ? (recebidoHoje[index] as number) : 0;
            const vendas = Math.max(0, saldoAnt - total);
            const saldoPrevisto = total + (pedidoCaixas[index] || 0) * ITENS_POR_CAIXA;
            const precoUnitario = PRECOS_PEDIDO[it.sabor]?.[tipoProduto] || 0;
            const valorTotalPedido = (pedidoCaixas[index] || 0) * ITENS_POR_CAIXA * precoUnitario;
            
            return (
              <tr key={index}>
                <td>{it.sabor}</td>
                <td><input className="input-ro" readOnly value={saldoAnt} /></td>
                <td>
                  <input
                    className="input-editavel no-spinner"
                    type="number"
                    inputMode="numeric"
                    placeholder=""
                    value={recebidoHoje[index]}
                    onChange={(e) => alterarRecebido(index, e.target.value)}
                    min={0}
                    style={{ width: 70 }}
                  />
                </td>
                <td>
                  <input className="input-editavel no-spinner" type="number" inputMode="numeric" placeholder="" min={0} value={it.freezer} onChange={(e) => {
                    const n = e.currentTarget.valueAsNumber;
                    alterarLinha(index, 'freezer', Number.isNaN(n) ? '' : n);
                  }} style={{ width: 70 }} />
                </td>
                <td>
                  <input className="input-editavel no-spinner" type="number" inputMode="numeric" placeholder="" min={0} value={it.estufa} onChange={(e) => {
                    const n = e.currentTarget.valueAsNumber;
                    alterarLinha(index, 'estufa', Number.isNaN(n) ? '' : n);
                  }} style={{ width: 70 }} />
                </td>
                <td>
                  <input className="input-editavel no-spinner" type="number" inputMode="numeric" placeholder="" min={0} value={it.perdas} onChange={(e) => {
                    const n = e.currentTarget.valueAsNumber;
                    alterarLinha(index, 'perdas', Number.isNaN(n) ? '' : n);
                  }} style={{ width: 70 }} />
                </td>
                <td><input className="input-ro" readOnly value={total} /></td>
                <td><input className="input-ro" readOnly value={vendas} /></td>
                {mostrarPedido && (
                  <>
                    <td>
                      <input className="input-editavel no-spinner" type="number" inputMode="numeric" placeholder="" min={0} value={pedidoCaixas[index]} onChange={(e) => {
                        const n = e.currentTarget.valueAsNumber;
                        alterarPedido(index, Number.isNaN(n) ? '' : n);
                      }} style={{ width: 70 }} />
                    </td>
                    <td>
                      <input className="input-ro" readOnly value={`R$ ${precoUnitario.toFixed(2)}`} />
                    </td>
                    <td>
                      <input className="input-ro" readOnly value={`R$ ${valorTotalPedido.toFixed(2)}`} />
                    </td>
                    <td>
                      <input className="input-ro" readOnly value={saldoPrevisto} />
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td><strong>Total</strong></td>
            <td>{totais.totalSaldoAnterior}</td>
            <td>{totais.totalRecebido}</td>
            <td>{totais.totalFreezer}</td>
            <td>{totais.totalEstufa}</td>
            <td>{totais.totalPerdas}</td>
            <td>{totais.totalEmpadas}</td>
            <td>{totais.vendasDia}</td>
            {mostrarPedido && <td>{totais.totalPedido}</td>}
            {mostrarPedido && <td>-</td>}
            {mostrarPedido && <td>R$ {totais.valorTotalPedido.toFixed(2)}</td>}
            {mostrarPedido && <td>{totais.totalPedidoUnidades}</td>}
          </tr>
          <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
            <td><strong>Resumo</strong></td>
            <td colSpan={5}></td>
            <td><strong>Caixas: {totais.totalEmpadasCaixas}</strong></td>
            <td><strong>Valor Vendas: R$ {(totais.vendasDia * 7.00).toFixed(2)}</strong></td>
            {mostrarPedido && <td colSpan={4}></td>}
          </tr>
        </tfoot>
      </table>
      */}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="salvar-btn" onClick={salvar}>
          Salvar Contagem
        </button>
      </div>
    </div>
  );
};

const ResumoCard: React.FC<{ titulo: string; valor: string; destaque?: boolean; alerta?: boolean; ajuda?: string }> = ({ titulo, valor, destaque, alerta, ajuda }) => {
  return (
    <div style={{
      padding: 10,
      border: '1px solid #444',
      borderRadius: 8,
      background: alerta ? '#3a1f1f' : destaque ? '#1f2a3a' : '#202020',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }}>
      <span style={{ opacity: 0.8 }}>{titulo}</span>
      <strong style={{ fontSize: 18 }}>{valor}</strong>
      {ajuda && <span style={{ opacity: 0.8, fontSize: 12 }}>{ajuda}</span>}
    </div>
  );
};

export default ControleDiario;
