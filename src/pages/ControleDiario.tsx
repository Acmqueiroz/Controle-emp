import React, { useState } from 'react';
import InventoryRow from '../components/InventoryRow';
import { ContagemItem } from '../types/ContagemItem';
import './ControleDiario.css'; // Importando o CSS

const sabores: string[] = [
  '4 Queijos', 'Bacalhau', 'Banana', 'Calabresa', 'Camarão', 'Camarão com Requeijão',
  'Carne Seca', 'Carne Seca com Requeijão', 'Chocolate', 'Frango',
  'Frango com Ameixa e Bacon', 'Frango com Azeitona', 'Frango com Bacon',
  'Frango com Cheddar', 'Frango com Palmito', 'Frango com Requeijão',
  'Palmito', 'Pizza', 'Queijo', 'Queijo com Alho', 'Queijo com Cebola', 'Romeu e Julieta'
];

const ControleDiario: React.FC = () => {
  const [data, setData] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [contagem, setContagem] = useState<ContagemItem[]>(
    sabores.map(sabor => ({
      sabor,
      freezer: '',
      estufa: '',
      perdas: '',
    }))
  );

  const [mostrarPedido, setMostrarPedido] = useState(false);
  const [pedidoCaixas, setPedidoCaixas] = useState<number[]>(sabores.map(() => 0));

  const handleChange = (index: number, field: keyof ContagemItem, value: number | '') => {
    const novaContagem = contagem.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setContagem(novaContagem);
  };

  const handlePedidoChange = (index: number, value: number) => {
    const novoPedido = [...pedidoCaixas];
    novoPedido[index] = value;
    setPedidoCaixas(novoPedido);
  };

  const calcularSaldoPrevisto = (index: number) => {
    const total =
      (typeof contagem[index].freezer === 'number' ? contagem[index].freezer : 0) +
      (typeof contagem[index].estufa === 'number' ? contagem[index].estufa : 0) -
      (typeof contagem[index].perdas === 'number' ? contagem[index].perdas : 0);

    return total + pedidoCaixas[index] * 18;
  };

  return (
    <div className="container">
      <h1>Controle Diário de Empadas</h1>

      <div className="controls">
        <label>
          Data:
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </label>

        <button onClick={() => setMostrarPedido(!mostrarPedido)}>
          {mostrarPedido ? 'Remover Pedido' : 'Adicionar Pedido'}
        </button>
      </div>

      <table className="tabela-controle">
        <thead>
          <tr>
            <th>Sabor</th>
            <th>Freezer</th>
            <th>Estufa</th>
            <th>Perdas</th>
            <th>Total</th>
            {mostrarPedido && (
              <>
                <th>Pedido (caixas)</th>
                <th>Saldo Previsto</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {contagem.map((item, index) => (
            <InventoryRow
              key={index}
              index={index}
              data={item}
              onChange={handleChange}
              mostrarPedido={mostrarPedido}
              pedidoCaixas={pedidoCaixas[index]}
              onPedidoChange={handlePedidoChange}
              saldoPrevisto={calcularSaldoPrevisto(index)}
            />
          ))}
        </tbody>
      </table>

      <button className="salvar-btn" onClick={() => console.log({ data, contagem, pedidoCaixas })}>
        Salvar Contagem
      </button>
    </div>
  );
};

export default ControleDiario;
