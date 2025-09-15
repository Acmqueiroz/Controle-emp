import React from 'react';
import { ContagemItem } from '../types/ContagemItem';

interface InventoryRowProps {
  index: number;
  data: ContagemItem;
  mostrarPedido: boolean;
  pedidoCaixas: number;
  onChange: (index: number, field: keyof ContagemItem, value: number | '') => void;
  onPedidoChange: (index: number, value: number) => void;
  saldoPrevisto: number;
}

const InventoryRow: React.FC<InventoryRowProps> = ({
  index,
  data,
  mostrarPedido,
  pedidoCaixas,
  onChange,
  onPedidoChange,
  saldoPrevisto,
}) => {
  const handleInputChange = (field: keyof ContagemItem) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : Number(e.target.value);
    onChange(index, field, value);
  };

  const handlePedidoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : Number(e.target.value);
    onPedidoChange(index, value);
  };

  const total =
    (typeof data.freezer === 'number' ? data.freezer : 0) +
    (typeof data.estufa === 'number' ? data.estufa : 0) -
    (typeof data.perdas === 'number' ? data.perdas : 0);

  return (
    <tr>
      <td>{data.sabor}</td>
      <td>
        <input
          type="number"
          min={0}
          value={data.freezer}
          onChange={handleInputChange('freezer')}
          style={{ width: '60px' }}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          value={data.estufa}
          onChange={handleInputChange('estufa')}
          style={{ width: '60px' }}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          value={data.perdas}
          onChange={handleInputChange('perdas')}
          style={{ width: '60px' }}
        />
      </td>
     <td>
 <input
  type="number"
  value={total}
  readOnly
  style={{
    width: '60px',
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #555',
    textAlign: 'center'
  }}
/>

</td>


      {mostrarPedido && (
        <>
          <td>
            <input
              type="number"
              min={0}
              value={pedidoCaixas}
              onChange={handlePedidoChange}
              style={{ width: '60px' }}
            />
          </td>
          <td>{saldoPrevisto}</td>
        </>
      )}
    </tr>
  );
};

export default InventoryRow;
