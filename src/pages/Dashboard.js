import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import './Dashboard.css';
const Dashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [periodo, setPeriodo] = useState('mes');
    // Carregar dados reais do Firebase
    const carregarDadosReais = async () => {
        try {
            // Buscar dados de contagem diária
            const contagemQuery = query(collection(db, 'contagem_diaria'), orderBy('data', 'desc'));
            const contagemSnapshot = await getDocs(contagemQuery);
            // Buscar pedidos
            const pedidosQuery = query(collection(db, 'pedidos'), orderBy('data', 'desc'));
            const pedidosSnapshot = await getDocs(pedidosQuery);
            const vendasReais = [];
            const pedidosReais = [];
            // Processar dados de contagem para gerar vendas
            contagemSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.itens && data.resumo && data.resumo.vendasDia > 0) {
                    data.itens.forEach((item) => {
                        if (item.sabor) {
                            // Calcular vendas por sabor baseado na proporção
                            const totalEmpadas = data.resumo.totalEmpadas || 1;
                            const proporcaoVendas = (item.freezer + item.estufa - item.perdas) / totalEmpadas;
                            const vendasSabor = Math.round(data.resumo.vendasDia * proporcaoVendas);
                            if (vendasSabor > 0) {
                                // Preços de venda
                                const precosVenda = {
                                    '4 Queijos': { empada: 2.59, empadao: 0 },
                                    'Bacalhau': { empada: 2.99, empadao: 0 },
                                    'Banana': { empada: 2.29, empadao: 0 },
                                    'Calabresa': { empada: 2.49, empadao: 0 },
                                    'Camarão': { empada: 3.14, empadao: 7.07 },
                                    'Camarão com Requeijão': { empada: 3.24, empadao: 0 },
                                    'Carne Seca': { empada: 3.54, empadao: 6.97 },
                                    'Carne Seca com Requeijão': { empada: 3.44, empadao: 0 },
                                    'Chocolate': { empada: 2.85, empadao: 0 },
                                    'Frango': { empada: 2.29, empadao: 4.02 },
                                    'Frango com Ameixa e Bacon': { empada: 3.24, empadao: 0 },
                                    'Frango com Azeitona': { empada: 2.99, empadao: 5.27 },
                                    'Frango com Bacon': { empada: 2.99, empadao: 0 },
                                    'Frango com Cheddar': { empada: 2.59, empadao: 0 },
                                    'Frango com Palmito': { empada: 2.99, empadao: 0 },
                                    'Frango com Requeijão': { empada: 2.49, empadao: 4.32 },
                                    'Palmito': { empada: 3.09, empadao: 0 },
                                    'Pizza': { empada: 2.39, empadao: 0 },
                                    'Queijo': { empada: 2.69, empadao: 0 },
                                    'Queijo com Alho': { empada: 2.85, empadao: 0 },
                                    'Queijo com Cebola': { empada: 2.49, empadao: 0 },
                                    'Romeu e Julieta': { empada: 2.99, empadao: 0 }
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
                                    formaPagamento: 'dinheiro'
                                });
                            }
                        }
                    });
                }
            });
            // Processar pedidos reais
            pedidosSnapshot.docs.forEach(doc => {
                const pedidoData = doc.data();
                pedidosReais.push({
                    id: doc.id,
                    ...pedidoData,
                    data: pedidoData.data.toDate()
                });
            });
            return { vendasReais, pedidosReais };
        }
        catch (error) {
            console.error('Erro ao carregar dados reais:', error);
            return { vendasReais: [], pedidosReais: [] };
        }
    };
    const calcularAnalytics = async () => {
        const { vendasReais, pedidosReais } = await carregarDadosReais();
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioAno = new Date(hoje.getFullYear(), 0, 1);
        // Vendas de hoje
        const vendasHoje = vendasReais
            .filter(v => v.data.toDateString() === hoje.toDateString())
            .reduce((acc, v) => acc + v.precoTotal, 0);
        // Vendas do mês
        const vendasMes = vendasReais
            .filter(v => v.data >= inicioMes)
            .reduce((acc, v) => acc + v.precoTotal, 0);
        // Vendas do ano
        const vendasAno = vendasReais
            .filter(v => v.data >= inicioAno)
            .reduce((acc, v) => acc + v.precoTotal, 0);
        // Lucro do mês (baseado em pedidos reais)
        const pedidosMes = pedidosReais
            .filter(p => p.data >= inicioMes)
            .reduce((acc, p) => acc + p.precoTotal, 0);
        const lucroMes = vendasMes - pedidosMes;
        // Top 5 sabores
        const sabores = {};
        vendasReais.forEach(venda => {
            if (!sabores[venda.sabor]) {
                sabores[venda.sabor] = { quantidade: 0, valor: 0 };
            }
            sabores[venda.sabor].quantidade += venda.quantidade;
            sabores[venda.sabor].valor += venda.precoTotal;
        });
        const saboresTop5 = Object.entries(sabores)
            .map(([sabor, dados]) => ({ sabor, ...dados }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 5);
        // Tendências (simuladas)
        const crescimentoVendas = 12.5; // %
        const crescimentoLucro = 8.3; // %
        // Alertas
        const alertas = [
            {
                tipo: 'estoque_baixo',
                mensagem: 'Estoque de FRANGO baixo - apenas 15 unidades restantes',
                prioridade: 'alta'
            },
            {
                tipo: 'lucro_baixo',
                mensagem: 'Margem de lucro abaixo da média esta semana',
                prioridade: 'media'
            },
            {
                tipo: 'vendas_baixas',
                mensagem: 'Vendas de hoje 20% abaixo da média',
                prioridade: 'baixa'
            }
        ];
        const dashboardData = {
            vendasHoje,
            vendasMes,
            vendasAno,
            lucroMes,
            saboresTop5,
            tendencias: {
                crescimentoVendas,
                crescimentoLucro
            },
            alertas
        };
        setAnalytics(dashboardData);
    };
    useEffect(() => {
        calcularAnalytics();
    }, [periodo]);
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };
    const getAlertaIcon = (tipo) => {
        switch (tipo) {
            case 'estoque_baixo':
                return '📦';
            case 'lucro_baixo':
                return '💰';
            case 'vendas_baixas':
                return '📉';
            default:
                return '⚠️';
        }
    };
    const getAlertaClass = (prioridade) => {
        switch (prioridade) {
            case 'alta':
                return 'alerta-alta';
            case 'media':
                return 'alerta-media';
            case 'baixa':
                return 'alerta-baixa';
            default:
                return '';
        }
    };
    if (!analytics) {
        return _jsx("div", { className: "dashboard-loading", children: "Carregando dashboard..." });
    }
    return (_jsxs("div", { className: "dashboard-container", children: [_jsxs("div", { className: "dashboard-header", children: [_jsx("h1", { children: "Dashboard - Controle Empadas" }), _jsx("div", { className: "dashboard-filters", children: _jsxs("select", { value: periodo, onChange: (e) => setPeriodo(e.target.value), className: "periodo-select", children: [_jsx("option", { value: "hoje", children: "Hoje" }), _jsx("option", { value: "semana", children: "Esta Semana" }), _jsx("option", { value: "mes", children: "Este M\u00EAs" }), _jsx("option", { value: "ano", children: "Este Ano" })] }) })] }), _jsxs("div", { className: "dashboard-grid", children: [_jsxs("div", { className: "metricas-principais", children: [_jsxs("div", { className: "card-metrica vendas-hoje", children: [_jsx("div", { className: "card-icon", children: "\uD83D\uDCB0" }), _jsxs("div", { className: "card-content", children: [_jsx("h3", { children: "Vendas Hoje" }), _jsx("p", { className: "valor", children: formatarMoeda(analytics.vendasHoje) }), _jsx("small", { children: "Receita do dia" })] })] }), _jsxs("div", { className: "card-metrica vendas-mes", children: [_jsx("div", { className: "card-icon", children: "\uD83D\uDCCA" }), _jsxs("div", { className: "card-content", children: [_jsx("h3", { children: "Vendas do M\u00EAs" }), _jsx("p", { className: "valor", children: formatarMoeda(analytics.vendasMes) }), _jsx("small", { children: "Receita mensal" })] })] }), _jsxs("div", { className: "card-metrica vendas-ano", children: [_jsx("div", { className: "card-icon", children: "\uD83D\uDCC8" }), _jsxs("div", { className: "card-content", children: [_jsx("h3", { children: "Vendas do Ano" }), _jsx("p", { className: "valor", children: formatarMoeda(analytics.vendasAno) }), _jsx("small", { children: "Receita anual" })] })] }), _jsxs("div", { className: "card-metrica lucro-mes", children: [_jsx("div", { className: "card-icon", children: "\uD83D\uDC8E" }), _jsxs("div", { className: "card-content", children: [_jsx("h3", { children: "Lucro do M\u00EAs" }), _jsx("p", { className: "valor", children: formatarMoeda(analytics.lucroMes) }), _jsx("small", { children: "Lucro l\u00EDquido" })] })] })] }), _jsxs("div", { className: "tendencias-section", children: [_jsx("h2", { children: "Tend\u00EAncias" }), _jsxs("div", { className: "cards-tendencias", children: [_jsxs("div", { className: "card-tendencia", children: [_jsx("h4", { children: "Crescimento de Vendas" }), _jsxs("div", { className: "tendencia-valor positiva", children: ["+", analytics.tendencias.crescimentoVendas, "%"] }), _jsx("small", { children: "vs. m\u00EAs anterior" })] }), _jsxs("div", { className: "card-tendencia", children: [_jsx("h4", { children: "Crescimento de Lucro" }), _jsxs("div", { className: "tendencia-valor positiva", children: ["+", analytics.tendencias.crescimentoLucro, "%"] }), _jsx("small", { children: "vs. m\u00EAs anterior" })] })] })] }), _jsxs("div", { className: "sabores-top-section", children: [_jsx("h2", { children: "Top 5 Sabores Mais Vendidos" }), _jsx("div", { className: "lista-sabores-dashboard", children: analytics.saboresTop5.map((item, index) => (_jsxs("div", { className: "item-sabor-dashboard", children: [_jsxs("div", { className: "posicao-dashboard", children: ["#", index + 1] }), _jsxs("div", { className: "info-sabor-dashboard", children: [_jsx("h4", { children: item.sabor }), _jsxs("p", { children: [item.quantidade, " unidades vendidas"] }), _jsx("p", { className: "valor-sabor", children: formatarMoeda(item.valor) })] }), _jsx("div", { className: "barra-progresso-dashboard", children: _jsx("div", { className: "progresso-dashboard", style: {
                                                    width: `${(item.quantidade / analytics.saboresTop5[0].quantidade) * 100}%`
                                                } }) })] }, index))) })] }), _jsxs("div", { className: "alertas-section", children: [_jsx("h2", { children: "Alertas e Notifica\u00E7\u00F5es" }), _jsx("div", { className: "lista-alertas", children: analytics.alertas.map((alerta, index) => (_jsxs("div", { className: `alerta ${getAlertaClass(alerta.prioridade)}`, children: [_jsx("div", { className: "alerta-icon", children: getAlertaIcon(alerta.tipo) }), _jsxs("div", { className: "alerta-content", children: [_jsx("p", { children: alerta.mensagem }), _jsxs("small", { children: ["Prioridade: ", alerta.prioridade] })] })] }, index))) })] }), _jsxs("div", { className: "grafico-section", children: [_jsx("h2", { children: "Vendas dos \u00DAltimos 7 Dias" }), _jsx("div", { className: "grafico-barras-dashboard", children: Array.from({ length: 7 }, (_, i) => {
                                    const data = new Date();
                                    data.setDate(data.getDate() - (6 - i));
                                    const vendasDia = Math.random() * 1000 + 500;
                                    return (_jsxs("div", { className: "barra-dia-dashboard", children: [_jsx("div", { className: "barra-vendas-dashboard", style: {
                                                    height: `${(vendasDia / 1500) * 200}px`
                                                } }), _jsxs("span", { className: "label-dia-dashboard", children: [data.getDate(), "/", data.getMonth() + 1] }), _jsx("span", { className: "valor-dia-dashboard", children: formatarMoeda(vendasDia) })] }, i));
                                }) })] }), _jsxs("div", { className: "performance-section", children: [_jsx("h2", { children: "Resumo de Performance" }), _jsxs("div", { className: "cards-performance", children: [_jsxs("div", { className: "card-performance", children: [_jsx("h4", { children: "Meta Mensal" }), _jsx("div", { className: "progresso-meta", children: _jsx("div", { className: "barra-progresso-meta", style: { width: '75%' } }) }), _jsx("p", { children: "75% conclu\u00EDdo" })] }), _jsxs("div", { className: "card-performance", children: [_jsx("h4", { children: "Efici\u00EAncia de Produ\u00E7\u00E3o" }), _jsx("div", { className: "progresso-meta", children: _jsx("div", { className: "barra-progresso-meta", style: { width: '88%' } }) }), _jsx("p", { children: "88% de efici\u00EAncia" })] }), _jsxs("div", { className: "card-performance", children: [_jsx("h4", { children: "Satisfa\u00E7\u00E3o do Cliente" }), _jsx("div", { className: "progresso-meta", children: _jsx("div", { className: "barra-progresso-meta", style: { width: '92%' } }) }), _jsx("p", { children: "4.6/5.0 estrelas" })] })] })] })] })] }));
};
export default Dashboard;
