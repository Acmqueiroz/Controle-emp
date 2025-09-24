import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import './TabelaPrecos.css';
const TabelaPrecos = () => {
    const [precos, setPrecos] = useState([]);
    const [mesAtual, setMesAtual] = useState(new Date().toLocaleString('pt-BR', { month: 'long' }).toUpperCase());
    // Dados baseados na tabela da imagem
    const precosIniciais = [
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
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };
    const formatarPercentual = (valor) => {
        return `${valor.toFixed(2)}%`;
    };
    const getVariacaoIcon = (tipo) => {
        switch (tipo) {
            case 'aumento':
                return '↗️';
            case 'diminuicao':
                return '↘️';
            default:
                return '➡️';
        }
    };
    const getVariacaoClass = (tipo) => {
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
    return (_jsxs("div", { className: "tabela-precos-container", children: [_jsxs("div", { className: "tabela-precos-header", children: [_jsxs("h1", { children: ["TABELA DE PRE\u00C7OS - ", mesAtual] }), _jsxs("div", { className: "tabela-precos-actions", children: [_jsx("button", { className: "btn-editar", children: "Editar Pre\u00E7os" }), _jsx("button", { className: "btn-exportar", children: "Exportar" })] })] }), _jsxs("div", { className: "tabela-precos-content", children: [_jsxs("div", { className: "secao-produtos", children: [_jsx("h2", { children: "EMPAD\u00D5ES" }), _jsxs("table", { className: "tabela-precos", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Sabor" }), _jsx("th", { children: "Unidade" }), _jsx("th", { children: "Caixa" }), _jsx("th", { children: "Varia\u00E7\u00E3o" })] }) }), _jsx("tbody", { children: empadoes.map((produto, index) => (_jsxs("tr", { children: [_jsx("td", { className: "sabor", children: produto.nome }), _jsx("td", { className: "preco", children: formatarMoeda(produto.precoUnidade) }), _jsx("td", { className: "preco", children: formatarMoeda(produto.precoCaixa) }), _jsxs("td", { className: `variacao ${getVariacaoClass(produto.variacaoTipo)}`, children: [getVariacaoIcon(produto.variacaoTipo), " ", formatarPercentual(produto.variacao)] })] }, index))) })] })] }), _jsxs("div", { className: "secao-produtos", children: [_jsx("h2", { children: "EMPADAS" }), _jsxs("table", { className: "tabela-precos", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Sabor" }), _jsx("th", { children: "Unidade" }), _jsx("th", { children: "Caixa" }), _jsx("th", { children: "Varia\u00E7\u00E3o" })] }) }), _jsx("tbody", { children: empadas.map((produto, index) => (_jsxs("tr", { children: [_jsx("td", { className: "sabor", children: produto.nome }), _jsx("td", { className: "preco", children: formatarMoeda(produto.precoUnidade) }), _jsx("td", { className: "preco", children: formatarMoeda(produto.precoCaixa) }), _jsxs("td", { className: `variacao ${getVariacaoClass(produto.variacaoTipo)}`, children: [getVariacaoIcon(produto.variacaoTipo), " ", formatarPercentual(produto.variacao)] })] }, index))) })] })] })] }), _jsxs("div", { className: "tabela-precos-footer", children: [_jsx("p", { children: "D\u00FAvidas estamos \u00E0 disposi\u00E7\u00E3o." }), _jsx("p", { children: "Atenciosamente" })] })] }));
};
export default TabelaPrecos;
