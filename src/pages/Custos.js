import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import TabelaPrecos from '../components/TabelaPrecos';
import './Custos.css';
const Custos = () => {
    const [vendas, setVendas] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [precos, setPrecos] = useState([]);
    const [filtroData, setFiltroData] = useState({
        inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        fim: new Date()
    });
    const [mostrarTabelaPrecos, setMostrarTabelaPrecos] = useState(false);
    // Carregar dados do Firebase
    useEffect(() => {
        const carregarDados = async () => {
            try {
                // Carregar pedidos do Firebase
                const pedidosQuery = query(collection(db, 'pedidos'), orderBy('data', 'desc'));
                const pedidosSnapshot = await getDocs(pedidosQuery);
                const pedidosData = pedidosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    data: doc.data().data.toDate()
                }));
                setPedidos(pedidosData);
                // Carregar vendas reais baseadas nos dados de contagem diária
                const vendasReais = [];
                // Buscar dados de contagem diária para calcular vendas reais
                const contagemQuery = query(collection(db, 'contagem_diaria'), orderBy('data', 'desc'));
                const contagemSnapshot = await getDocs(contagemQuery);
                contagemSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.itens && data.resumo) {
                        data.itens.forEach((item) => {
                            if (item.sabor && data.resumo.vendasDia > 0) {
                                // Calcular vendas por sabor baseado na proporção
                                const totalEmpadas = data.resumo.totalEmpadas || 1;
                                const proporcaoVendas = (item.freezer + item.estufa - item.perdas) / totalEmpadas;
                                const vendasSabor = Math.round(data.resumo.vendasDia * proporcaoVendas);
                                if (vendasSabor > 0) {
                                    // Preços de venda (diferentes dos preços de custo)
                                    const precosVenda = {
                                        '4 Queijos': { empada: 2.75, empadao: 0 },
                                        'Bacalhau': { empada: 2.75, empadao: 0 },
                                        'Banana': { empada: 2.40, empadao: 0 },
                                        'Calabresa': { empada: 2.58, empadao: 0 },
                                        'Camarão': { empada: 3.14, empadao: 7.07 },
                                        'Camarão com Requeijão': { empada: 3.24, empadao: 0 },
                                        'Carne Seca': { empada: 3.54, empadao: 6.97 },
                                        'Carne Seca com Requeijão': { empada: 3.44, empadao: 0 },
                                        'Chocolate': { empada: 2.85, empadao: 0 },
                                        'Frango': { empada: 2.59, empadao: 5.00 },
                                        'Frango com Ameixa e Bacon': { empada: 3.07, empadao: 0 },
                                        'Frango com Azeitona': { empada: 2.95, empadao: 5.63 },
                                        'Frango com Bacon': { empada: 2.99, empadao: 0 },
                                        'Frango com Cheddar': { empada: 2.75, empadao: 0 },
                                        'Frango com Palmito': { empada: 2.99, empadao: 0 },
                                        'Frango com Requeijão': { empada: 2.69, empadao: 5.10 },
                                        'Palmito': { empada: 3.09, empadao: 0 },
                                        'Pizza': { empada: 2.39, empadao: 0 },
                                        'Queijo': { empada: 4.02, empadao: 0 },
                                        'Queijo com Alho': { empada: 3.77, empadao: 0 },
                                        'Queijo com Cebola': { empada: 2.69, empadao: 0 },
                                        'Romeu e Julieta': { empada: 3.31, empadao: 0 }
                                    };
                                    const tipoProduto = data.resumo.tipoProduto || 'empada';
                                    const precoUnidade = precosVenda[item.sabor]?.[tipoProduto] || 2.59;
                                    vendasReais.push({
                                        id: `${doc.id}-${item.sabor}`,
                                        data: data.data ? new Date(data.data) : new Date(),
                                        sabor: item.sabor,
                                        tipo: tipoProduto.toUpperCase(),
                                        quantidade: vendasSabor,
                                        precoUnidade,
                                        precoTotal: vendasSabor * precoUnidade,
                                        formaPagamento: 'dinheiro' // Padrão, pode ser expandido
                                    });
                                }
                            }
                        });
                    }
                });
                setVendas(vendasReais);
            }
            catch (error) {
                console.error('Erro ao carregar dados:', error);
                // Em caso de erro, usar dados de exemplo
                setPedidos([]);
                setVendas([]);
            }
        };
        carregarDados();
    }, []);
    const calcularTotais = () => {
        const vendasFiltradas = vendas.filter(v => v.data >= filtroData.inicio && v.data <= filtroData.fim);
        const pedidosFiltrados = pedidos.filter(p => p.data >= filtroData.inicio && p.data <= filtroData.fim);
        const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.precoTotal, 0);
        const totalPedidos = pedidosFiltrados.reduce((acc, p) => acc + p.precoTotal, 0);
        const lucroBruto = totalVendas - totalPedidos;
        const margemLucro = totalVendas > 0 ? (lucroBruto / totalVendas) * 100 : 0;
        return {
            totalVendas,
            totalPedidos,
            lucroBruto,
            margemLucro,
            quantidadeVendas: vendasFiltradas.reduce((acc, v) => acc + v.quantidade, 0),
            quantidadePedidos: pedidosFiltrados.reduce((acc, p) => acc + p.quantidade, 0)
        };
    };
    const getSaboresMaisVendidos = () => {
        const vendasFiltradas = vendas.filter(v => v.data >= filtroData.inicio && v.data <= filtroData.fim);
        const sabores = {};
        vendasFiltradas.forEach(venda => {
            if (!sabores[venda.sabor]) {
                sabores[venda.sabor] = { quantidade: 0, valor: 0 };
            }
            sabores[venda.sabor].quantidade += venda.quantidade;
            sabores[venda.sabor].valor += venda.precoTotal;
        });
        return Object.entries(sabores)
            .map(([sabor, dados]) => ({ sabor, ...dados }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 5);
    };
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };
    const totais = calcularTotais();
    const saboresTop = getSaboresMaisVendidos();
    return (_jsxs("div", { className: "custos-container", children: [_jsxs("div", { className: "custos-header", children: [_jsx("h1", { children: "Controle de Custos" }), _jsxs("div", { className: "custos-actions", children: [_jsxs("button", { className: "btn-tabela-precos", onClick: () => setMostrarTabelaPrecos(!mostrarTabelaPrecos), children: [mostrarTabelaPrecos ? 'Ocultar' : 'Ver', " Tabela de Pre\u00E7os"] }), _jsx("button", { className: "btn-adicionar-venda", children: "+ Nova Venda" }), _jsx("button", { className: "btn-adicionar-pedido", children: "+ Novo Pedido" })] })] }), mostrarTabelaPrecos && (_jsx("div", { className: "tabela-precos-section", children: _jsx(TabelaPrecos, {}) })), _jsxs("div", { className: "filtros-section", children: [_jsx("h3", { children: "Filtros de Per\u00EDodo" }), _jsxs("div", { className: "filtros", children: [_jsxs("div", { className: "filtro-item", children: [_jsx("label", { children: "Data In\u00EDcio:" }), _jsx("input", { type: "date", value: filtroData.inicio.toISOString().split('T')[0], onChange: (e) => setFiltroData(prev => ({
                                            ...prev,
                                            inicio: new Date(e.target.value)
                                        })) })] }), _jsxs("div", { className: "filtro-item", children: [_jsx("label", { children: "Data Fim:" }), _jsx("input", { type: "date", value: filtroData.fim.toISOString().split('T')[0], onChange: (e) => setFiltroData(prev => ({
                                            ...prev,
                                            fim: new Date(e.target.value)
                                        })) })] })] })] }), _jsxs("div", { className: "resumo-financeiro", children: [_jsx("h3", { children: "Resumo Financeiro" }), _jsxs("div", { className: "cards-resumo", children: [_jsxs("div", { className: "card", children: [_jsx("h4", { children: "Total de Vendas" }), _jsx("p", { className: "valor-positivo", children: formatarMoeda(totais.totalVendas) }), _jsxs("small", { children: [totais.quantidadeVendas, " unidades"] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { children: "Total de Pedidos" }), _jsx("p", { className: "valor-negativo", children: formatarMoeda(totais.totalPedidos) }), _jsxs("small", { children: [totais.quantidadePedidos, " unidades"] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { children: "Lucro Bruto" }), _jsx("p", { className: totais.lucroBruto >= 0 ? 'valor-positivo' : 'valor-negativo', children: formatarMoeda(totais.lucroBruto) }), _jsxs("small", { children: ["Margem: ", totais.margemLucro.toFixed(1), "%"] })] })] })] }), _jsxs("div", { className: "sabores-mais-vendidos", children: [_jsx("h3", { children: "Top 5 Sabores Mais Vendidos" }), _jsx("div", { className: "lista-sabores", children: saboresTop.map((item, index) => (_jsxs("div", { className: "item-sabor", children: [_jsxs("div", { className: "posicao", children: ["#", index + 1] }), _jsxs("div", { className: "info-sabor", children: [_jsx("h4", { children: item.sabor }), _jsxs("p", { children: [item.quantidade, " unidades - ", formatarMoeda(item.valor)] })] })] }, index))) })] }), _jsxs("div", { className: "tabelas-detalhadas", children: [_jsxs("div", { className: "tabela-vendas", children: [_jsx("h3", { children: "Vendas Recentes" }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Data" }), _jsx("th", { children: "Sabor" }), _jsx("th", { children: "Tipo" }), _jsx("th", { children: "Qtd" }), _jsx("th", { children: "Valor Unit." }), _jsx("th", { children: "Total" }), _jsx("th", { children: "Pagamento" })] }) }), _jsx("tbody", { children: vendas
                                            .filter(v => v.data >= filtroData.inicio && v.data <= filtroData.fim)
                                            .slice(0, 10)
                                            .map(venda => (_jsxs("tr", { children: [_jsx("td", { children: venda.data.toLocaleDateString('pt-BR') }), _jsx("td", { children: venda.sabor }), _jsx("td", { children: venda.tipo }), _jsx("td", { children: venda.quantidade }), _jsx("td", { children: formatarMoeda(venda.precoUnidade) }), _jsx("td", { children: formatarMoeda(venda.precoTotal) }), _jsx("td", { children: venda.formaPagamento })] }, venda.id))) })] })] }), _jsxs("div", { className: "tabela-pedidos", children: [_jsx("h3", { children: "Pedidos Recentes" }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Data" }), _jsx("th", { children: "Sabor" }), _jsx("th", { children: "Tipo" }), _jsx("th", { children: "Qtd" }), _jsx("th", { children: "Valor Unit." }), _jsx("th", { children: "Total" }), _jsx("th", { children: "Fornecedor" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: pedidos
                                            .filter(p => p.data >= filtroData.inicio && p.data <= filtroData.fim)
                                            .slice(0, 10)
                                            .map(pedido => (_jsxs("tr", { children: [_jsx("td", { children: pedido.data.toLocaleDateString('pt-BR') }), _jsx("td", { children: pedido.sabor }), _jsx("td", { children: pedido.tipo }), _jsx("td", { children: pedido.quantidade }), _jsx("td", { children: formatarMoeda(pedido.precoUnidade) }), _jsx("td", { children: formatarMoeda(pedido.precoTotal) }), _jsx("td", { children: pedido.fornecedor }), _jsx("td", { children: _jsx("span", { className: `status ${pedido.status}`, children: pedido.status }) })] }, pedido.id))) })] })] })] })] }));
};
export default Custos;
