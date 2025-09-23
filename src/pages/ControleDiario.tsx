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
  '4 Queijos': { empada: 1.80, empadao: 0 },
  'Bacalhau': { empada: 2.20, empadao: 0 },
  'Banana': { empada: 1.50, empadao: 0 },
  'Calabresa': { empada: 1.70, empadao: 0 },
  'Camarão': { empada: 2.50, empadao: 4.50 },
  'Camarão com Requeijão': { empada: 2.60, empadao: 0 },
  'Carne Seca': { empada: 2.80, empadao: 5.00 },
  'Carne Seca com Requeijão': { empada: 2.70, empadao: 0 },
  'Chocolate': { empada: 1.90, empadao: 0 },
  'Frango': { empada: 1.50, empadao: 2.70 },
  'Frango com Ameixa e Bacon': { empada: 2.40, empadao: 0 },
  'Frango com Azeitona': { empada: 2.20, empadao: 3.90 },
  'Frango com Bacon': { empada: 2.20, empadao: 0 },
  'Frango com Cheddar': { empada: 1.80, empadao: 0 },
  'Frango com Palmito': { empada: 2.20, empadao: 0 },
  'Frango com Requeijão': { empada: 1.70, empadao: 3.00 },
  'Palmito': { empada: 2.30, empadao: 0 },
  'Pizza': { empada: 1.60, empadao: 0 },
  'Queijo': { empada: 2.00, empadao: 0 },
  'Queijo com Alho': { empada: 1.90, empadao: 0 },
  'Queijo com Cebola': { empada: 1.70, empadao: 0 },
  'Romeu e Julieta': { empada: 2.10, empadao: 0 }
};

const numberOrZero = (value: number | '' | undefined): number => {
  return typeof value === 'number' ? value : Number(value) || 0;
};

const ControleDiario: React.FC = () => {
  const [data, setData] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [mostrarPedido, setMostrarPedido] = useState<boolean>(true);
  const [modoEdicao, setModoEdicao] = useState<boolean>(false);
  const [documentoId, setDocumentoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<boolean>(false);

  // Função para obter sabores baseado no tipo de produto
  const getSaboresAtuais = () => {
    return tipoProduto === 'empada' ? SABORES_EMPADA : SABORES_EMPADAO;
  };

  // Iniciar campos vazios para digitação
  const [linhas, setLinhas] = useState<ContagemItem[]>([]);
  const [pedidoCaixas, setPedidoCaixas] = useState<number[]>([]);
  const [recebidoHoje, setRecebidoHoje] = useState<(number | '')[]>([]);
  const [tipoProduto, setTipoProduto] = useState<'empada' | 'empadao'>('empada');

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
        const saboresAtuais = getSaboresAtuais();
        setLinhas(docData.itens || saboresAtuais.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
        setPedidoCaixas(docData.pedidoCaixas || saboresAtuais.map(() => 0));
        setRecebidoHoje(docData.recebidoHoje || saboresAtuais.map(() => ''));
        setTipoProduto(docData.resumo?.tipoProduto || 'empada');
        
        console.log('Dados carregados para edição:', docData);
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

  // Função para carregar dados do dia anterior (comportamento original)
  const carregarDadosAnteriores = async (dataSelecionada: string) => {
    const anterior = await buscarDocumentoAnterior(dataSelecionada);
    if (!anterior) {
      setSaldoAnteriorPorSabor({});
      const saboresAtuais = getSaboresAtuais();
      setRecebidoHoje(saboresAtuais.map(() => ''));
      return;
    }
    const saldoMap: Record<string, number> = {};
    anterior.itens.forEach((i) => {
      const totalCalc = numberOrZero(i.freezer as any) + numberOrZero(i.estufa as any) - numberOrZero(i.perdas as any);
      const saldoInf = Number((i as any).saldoInformado ?? 0) || 0;
      saldoMap[i.sabor] = saldoInf || totalCalc;
    });
    setSaldoAnteriorPorSabor(saldoMap);

    // Prefill Recebido com base no pedido do dia anterior (caixas * 18)
    const saboresAtuais = getSaboresAtuais();
    const prefillRecebido = saboresAtuais.map((_, idx) => {
      const caixas = anterior.pedidoCaixas?.[idx] || 0;
      return caixas * ITENS_POR_CAIXA;
    });
    setRecebidoHoje(prefillRecebido);
  };

  useEffect(() => {
    carregarDadosDoDia(data);
  }, [data]);

  // Atualizar sabores quando o tipo de produto mudar
  useEffect(() => {
    const saboresAtuais = getSaboresAtuais();
    
    // Se não está em modo de edição, inicializar com sabores vazios
    if (!modoEdicao) {
      setLinhas(saboresAtuais.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
      setPedidoCaixas(saboresAtuais.map(() => 0));
      setRecebidoHoje(saboresAtuais.map(() => ''));
    }
  }, [tipoProduto]);

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

  const totais = useMemo(() => {
    const totalFreezer = linhas.reduce((acc, it) => acc + numberOrZero(it.freezer), 0);
    const totalEstufa = linhas.reduce((acc, it) => acc + numberOrZero(it.estufa), 0);
    const totalPerdas = linhas.reduce((acc, it) => acc + numberOrZero(it.perdas), 0);

    const totalEmpadas = totalFreezer + totalEstufa - totalPerdas;
    const totalEmpadasCaixas = Math.floor(totalEmpadas / ITENS_POR_CAIXA);
    const totalPedido = pedidoCaixas.reduce((acc, v) => acc + (v || 0), 0);
    const totalPedidoUnidades = totalPedido * ITENS_POR_CAIXA;

    const totalFreezerCaixas = Math.floor(totalFreezer / ITENS_POR_CAIXA);
    const capacidadeOcupada = totalFreezerCaixas + totalPedido;
    const capacidadeRestante = CAPACIDADE_FREEZER_CAIXAS - capacidadeOcupada;

    const totalRecebido = recebidoHoje.reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
    const saboresAtuais = getSaboresAtuais();
    const totalSaldoAnterior = saboresAtuais.reduce((acc, s) => acc + (saldoAnteriorPorSabor[s] || 0), 0);
    // Vendas do dia = Saldo anterior + Recebido - Total (calculado)
    const vendasDia = totalSaldoAnterior + totalRecebido - totalEmpadas;

    // Calcular valor total do pedido
    const valorTotalPedido = pedidoCaixas.reduce((acc, caixas, index) => {
      if (caixas > 0) {
        const sabor = saboresAtuais[index];
        const preco = PRECOS_PEDIDO[sabor]?.[tipoProduto] || 0;
        const unidades = caixas * ITENS_POR_CAIXA;
        return acc + (unidades * preco);
      }
      return acc;
    }, 0);

    return {
      totalFreezer,
      totalEstufa,
      totalPerdas,
      totalEmpadas,
      totalEmpadasCaixas,
      totalPedido,
      totalPedidoUnidades,
      totalFreezerCaixas,
      capacidadeOcupada,
      capacidadeRestante,
      excedeuCapacidade: capacidadeRestante < 0,
      vendasDia,
      totalRecebido,
      totalSaldoAnterior,
      valorTotalPedido,
    };
  }, [linhas, pedidoCaixas, recebidoHoje, saldoAnteriorPorSabor, tipoProduto]);

  const salvar = async () => {
    setCarregando(true);
    try {
      const resumo = {
        totalFreezer: totais.totalFreezer,
        totalEstufa: totais.totalEstufa,
        totalPerdas: totais.totalPerdas,
        totalEmpadas: totais.totalEmpadas,
        totalPedidoCaixas: totais.totalPedido,
        capacidadeFreezerCaixas: CAPACIDADE_FREEZER_CAIXAS,
        capacidadeOcupadaCaixas: totais.capacidadeOcupada,
        capacidadeRestanteCaixas: totais.capacidadeRestante,
        vendasDia: totais.vendasDia,
        recebidoUnidades: totais.totalRecebido,
        saldoAnteriorUnidades: totais.totalSaldoAnterior,
        valorTotalPedido: totais.valorTotalPedido,
        tipoProduto,
      };

      // Criar pedidos para o sistema de custos
      const saboresAtuais = getSaboresAtuais();
      const pedidos = pedidoCaixas.map((caixas, index) => {
        if (caixas > 0) {
          const sabor = saboresAtuais[index];
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
          dataAtualizacao: new Date()
        });
        alert(`Registro atualizado! ${pedidos.length > 0 ? `Pedido de R$ ${totais.valorTotalPedido.toFixed(2)} enviado para controle de custos.` : ''}`);
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
          dataCriacao: new Date()
        });
        alert(`Contagem salva! ${pedidos.length > 0 ? `Pedido de R$ ${totais.valorTotalPedido.toFixed(2)} enviado para controle de custos.` : ''}`);
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
    const saboresAtuais = getSaboresAtuais();
    setLinhas(saboresAtuais.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
    setPedidoCaixas(saboresAtuais.map(() => 0));
    setRecebidoHoje(saboresAtuais.map(() => ''));
    setModoEdicao(false);
    setDocumentoId(null);
  };

  return (
    <div className="container">
      <h1>Controle Diário {modoEdicao && <span style={{ color: '#f39c12', fontSize: '0.8em' }}>(Editando)</span>}</h1>

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
        <label>
          Tipo de Produto:
          <select 
            value={tipoProduto} 
            onChange={(e) => setTipoProduto(e.target.value as 'empada' | 'empadao')}
            disabled={carregando}
          >
            <option value="empada">Empada</option>
            <option value="empadao">Empadão</option>
          </select>
        </label>
        <button onClick={() => setMostrarPedido((v) => !v)} disabled={carregando}>
          {mostrarPedido ? 'Ocultar Pedido' : 'Mostrar Pedido'}
        </button>
        {modoEdicao && (
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
        <ResumoCard titulo="Saldo anterior" valor={`${totais.totalSaldoAnterior}`} />
        <ResumoCard titulo="Recebido (unid)" valor={`${totais.totalRecebido}`} />
        <ResumoCard titulo="Vendas do dia" destaque valor={`${totais.vendasDia}`} />
        <ResumoCard titulo="Freezer" valor={`${totais.totalFreezer}`} />
        <ResumoCard titulo="Estufa" valor={`${totais.totalEstufa}`} />
        <ResumoCard titulo="Perdas" valor={`${totais.totalPerdas}`} />
        <ResumoCard titulo="Total Empadas" valor={`${totais.totalEmpadas}`} />
        <ResumoCard titulo="Pedido (caixas)" valor={`${totais.totalPedido}`} />
        <ResumoCard titulo="Valor do Pedido" valor={`R$ ${totais.valorTotalPedido.toFixed(2)}`} destaque />
      </div>

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
            const vendas = saldoAnt + recebido - total;
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
        </tfoot>
      </table>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="salvar-btn" onClick={salvar} disabled={totais.excedeuCapacidade}>
          Salvar Contagem
        </button>
        {totais.excedeuCapacidade && (
          <span style={{ color: '#f66' }}>Reduza o pedido: excedeu a capacidade do freezer.</span>
        )}
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
