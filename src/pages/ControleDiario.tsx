import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { ContagemItem } from '../types/ContagemItem';
import './ControleDiario.css';
import { buscarDocumentoAnterior } from '../services/firebaseService';

const SABORES: string[] = [
  '4 Queijos', 'Bacalhau', 'Banana', 'Calabresa', 'Camarão', 'Camarão com Requeijão',
  'Carne Seca', 'Carne Seca com Requeijão', 'Chocolate', 'Frango',
  'Frango com Ameixa e Bacon', 'Frango com Azeitona', 'Frango com Bacon',
  'Frango com Cheddar', 'Frango com Palmito', 'Frango com Requeijão',
  'Palmito', 'Pizza', 'Queijo', 'Queijo com Alho', 'Queijo com Cebola', 'Romeu e Julieta'
];

const CAPACIDADE_FREEZER_CAIXAS = 52;
const ITENS_POR_CAIXA = 18;

const numberOrZero = (value: number | '' | undefined): number => {
  return typeof value === 'number' ? value : Number(value) || 0;
};

const ControleDiario: React.FC = () => {
  const [data, setData] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [mostrarPedido, setMostrarPedido] = useState<boolean>(true);

  // Iniciar campos vazios para digitação
  const [linhas, setLinhas] = useState<ContagemItem[]>(
    SABORES.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' }))
  );
  const [pedidoCaixas, setPedidoCaixas] = useState<number[]>(SABORES.map(() => 0));
  const [recebidoHoje, setRecebidoHoje] = useState<(number | '')[]>(SABORES.map(() => ''));

  const [saldoAnteriorPorSabor, setSaldoAnteriorPorSabor] = useState<Record<string, number>>({});

  useEffect(() => {
    const carregarAnterior = async () => {
      const anterior = await buscarDocumentoAnterior(data);
      if (!anterior) {
        setSaldoAnteriorPorSabor({});
        // sem anterior, mantém recebido vazio (ou zeros)
        setRecebidoHoje(SABORES.map(() => ''));
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
      const prefillRecebido = SABORES.map((_, idx) => {
        const caixas = anterior.pedidoCaixas?.[idx] || 0;
        return caixas * ITENS_POR_CAIXA;
      });
      setRecebidoHoje(prefillRecebido);
    };
    carregarAnterior();
  }, [data]);

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
    const totalSaldoAnterior = SABORES.reduce((acc, s) => acc + (saldoAnteriorPorSabor[s] || 0), 0);
    // Vendas do dia = Saldo anterior + Recebido - Total (calculado)
    const vendasDia = totalSaldoAnterior + totalRecebido - totalEmpadas;

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
    };
  }, [linhas, pedidoCaixas, recebidoHoje, saldoAnteriorPorSabor]);

  const salvar = async () => {
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
    };

    const empadasCollection = collection(db, 'contagem_diaria');
    await addDoc(empadasCollection, {
      data,
      itens: linhas,
      pedidoCaixas,
      recebidoHoje,
      resumo,
    });
    alert('Contagem salva!');
  };

  return (
    <div className="container">
      <h1>Controle Diário</h1>

      <div className="controls" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          Data:
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <button onClick={() => setMostrarPedido((v) => !v)}>
          {mostrarPedido ? 'Ocultar Pedido' : 'Mostrar Pedido'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, margin: '12px 0' }}>
        <ResumoCard titulo="Saldo anterior" valor={`${totais.totalSaldoAnterior}`} />
        <ResumoCard titulo="Recebido (unid)" valor={`${totais.totalRecebido}`} />
        <ResumoCard titulo="Vendas do dia" destaque valor={`${totais.vendasDia}`} />
        <ResumoCard titulo="Freezer" valor={`${totais.totalFreezer}`} />
        <ResumoCard titulo="Estufa" valor={`${totais.totalEstufa}`} />
        <ResumoCard titulo="Perdas" valor={`${totais.totalPerdas}`} />
        <ResumoCard titulo="Total Empadas" valor={`${totais.totalEmpadas}`} />
        <ResumoCard titulo="Pedido (caixas)" valor={`${totais.totalPedido}`} />
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
