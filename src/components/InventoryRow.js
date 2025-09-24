import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const InventoryRow = ({ index, data, mostrarPedido, pedidoCaixas, onChange, onPedidoChange, saldoPrevisto, }) => {
    const handleInputChange = (field) => (e) => {
        const value = e.target.value === '' ? '' : Number(e.target.value);
        onChange(index, field, value);
    };
    const handlePedidoChange = (e) => {
        const value = e.target.value === '' ? 0 : Number(e.target.value);
        onPedidoChange(index, value);
    };
    const total = (typeof data.freezer === 'number' ? data.freezer : 0) +
        (typeof data.estufa === 'number' ? data.estufa : 0) -
        (typeof data.perdas === 'number' ? data.perdas : 0);
    const saldoInformado = typeof data.saldoInformado === 'number' ? data.saldoInformado : 0;
    const diferenca = saldoInformado - total;
    return (_jsxs("tr", { children: [_jsx("td", { children: data.sabor }), _jsx("td", { children: _jsx("input", { type: "number", min: 0, value: data.freezer, onChange: handleInputChange('freezer'), style: { width: '60px' } }) }), _jsx("td", { children: _jsx("input", { type: "number", min: 0, value: data.estufa, onChange: handleInputChange('estufa'), style: { width: '60px' } }) }), _jsx("td", { children: _jsx("input", { type: "number", min: 0, value: data.perdas, onChange: handleInputChange('perdas'), style: { width: '60px' } }) }), _jsx("td", { children: _jsx("input", { type: "number", value: total, readOnly: true, style: {
                        width: '60px',
                        backgroundColor: '#333',
                        color: '#fff',
                        border: '1px solid #555',
                        textAlign: 'center'
                    } }) }), _jsx("td", { children: _jsx("input", { type: "number", min: 0, value: data.saldoInformado ?? '', onChange: handleInputChange('saldoInformado'), style: { width: '60px' } }) }), _jsx("td", { children: _jsx("input", { type: "number", value: diferenca, readOnly: true, style: {
                        width: '60px',
                        backgroundColor: '#333',
                        color: '#fff',
                        border: '1px solid #555',
                        textAlign: 'center'
                    } }) }), mostrarPedido && (_jsxs(_Fragment, { children: [_jsx("td", { children: _jsx("input", { type: "number", min: 0, value: pedidoCaixas, onChange: handlePedidoChange, style: { width: '60px' } }) }), _jsx("td", { children: saldoPrevisto })] }))] }));
};
export default InventoryRow;
