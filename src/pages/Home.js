import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
const Home = () => {
    return (_jsxs("div", { style: { padding: '20px' }, children: [_jsx("h1", { style: { marginBottom: '20px' }, children: "Dashboard - Resumo Geral" }), _jsxs("div", { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }, children: [_jsx(Link, { to: "/contagem", children: _jsx("button", { children: "Contagem Di\u00E1ria" }) }), _jsx(Link, { to: "/semana", children: _jsx("button", { children: "Resumo da Semana" }) }), _jsx(Link, { to: "/mes", children: _jsx("button", { children: "Resumo do M\u00EAs" }) }), _jsx(Link, { to: "/pagamentos", children: _jsx("button", { children: "Pagamentos" }) }), _jsx(Link, { to: "/custos", children: _jsx("button", { children: "Custos" }) })] }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '20px' }, children: [_jsxs("div", { style: cardStyle, children: [_jsx("h3", { children: "Saldo Atual" }), _jsx("p", { children: "\uD83E\uDDCA Freezer: 320" }), _jsx("p", { children: "\uD83D\uDD25 Estufa: 85" }), _jsx("p", { children: "\uD83D\uDCA5 Perdas: 12" })] }), _jsxs("div", { style: cardStyle, children: [_jsx("h3", { children: "Vendas do Dia" }), _jsx("p", { children: "\uD83E\uDD67 Total Vendido: 70 empadas" }), _jsx("p", { children: "\uD83E\uDDFE Faturamento: R$ 350,00" })] }), _jsxs("div", { style: cardStyle, children: [_jsx("h3", { children: "Pedido em Tr\u00E2nsito" }), _jsx("p", { children: "\uD83D\uDCE6 Chegada esperada: Segunda-feira" }), _jsx("p", { children: "\uD83D\uDCCB Total Caixas: 12" }), _jsx("p", { children: "\uD83E\uDD67 Total Empadas: 216" })] }), _jsxs("div", { style: cardStyle, children: [_jsx("h3", { children: "Resumo do M\u00EAs" }), _jsx("p", { children: "\uD83D\uDCCA Empadas vendidas: 1.350" }), _jsx("p", { children: "\uD83D\uDCB8 Receita estimada: R$ 6.750,00" })] })] })] }));
};
// Estilo base dos cards
const cardStyle = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    width: '250px',
    backgroundColor: '#f9f9f9',
    color: '#333', // <-- cor do texto ajustada para tema claro dentro do card
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};
export default Home;
