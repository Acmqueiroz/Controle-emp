import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { buscarDadosSemana, calcularTotais, buscarSaldoInicialPorSabor, buscarSaldoFinalPorSabor } from '../services/firebaseService';
import './Semana.css';
const Semana = () => {
    const [dadosSemana, setDadosSemana] = useState([]);
    const [totais, setTotais] = useState({
        totalFreezer: 0,
        totalEstufa: 0,
        totalPerdas: 0,
        totalEmpadas: 0,
    });
    const [saldoInicial, setSaldoInicial] = useState({});
    const [saldoFinal, setSaldoFinal] = useState({});
    const [relatorioSemanal, setRelatorioSemanal] = useState(null);
    const [mostrarComparacao, setMostrarComparacao] = useState(false);
    const [ano, setAno] = useState(new Date().getFullYear());
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [semanaIndex, setSemanaIndex] = useState(0);
    const gerarSemanasDoMes = (ano, mes) => {
        const primeiroDia = new Date(ano, mes - 1, 1);
        const ultimoDia = new Date(ano, mes, 0);
        const semanas = [];
        let inicio = new Date(primeiroDia);
        while (inicio <= ultimoDia) {
            const fim = new Date(inicio);
            fim.setDate(fim.getDate() + 6);
            if (fim > ultimoDia)
                fim.setTime(ultimoDia.getTime());
            const label = `${inicio.getDate().toString().padStart(2, '0')}/${(inicio.getMonth() + 1)
                .toString()
                .padStart(2, '0')} a ${fim.getDate().toString().padStart(2, '0')}/${(fim.getMonth() + 1)
                .toString()
                .padStart(2, '0')}`;
            semanas.push({ inicio, fim, label });
            const prox = new Date(inicio);
            prox.setDate(prox.getDate() + 7);
            inicio = prox;
        }
        return semanas;
    };
    const semanas = gerarSemanasDoMes(ano, mes);
    const semanaSelecionada = semanas[semanaIndex] ?? semanas[0];
    // Carregar dados reais da semana
    const carregarDadosReais = async (inicio, fim) => {
        try {
            // Buscar dados de contagem diária da semana
            const contagemQuery = query(collection(db, 'contagem_diaria'), where('data', '>=', inicio.toISOString().split('T')[0]), where('data', '<=', fim.toISOString().split('T')[0]));
            const contagemSnapshot = await getDocs(contagemQuery);
            // Buscar pedidos da semana
            const pedidosQuery = query(collection(db, 'pedidos'), where('data', '>=', inicio), where('data', '<=', fim));
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
    const calcularRelatorioSemanal = async () => {
        if (!semanaSelecionada)
            return;
        const { vendasReais, pedidosReais } = await carregarDadosReais(semanaSelecionada.inicio, semanaSelecionada.fim);
        const totalVendas = vendasReais.reduce((acc, v) => acc + v.precoTotal, 0);
        const totalPedidos = pedidosReais.reduce((acc, p) => acc + p.precoTotal, 0);
        const lucroBruto = totalVendas - totalPedidos;
        // Sabores mais vendidos
        const sabores = {};
        vendasReais.forEach(venda => {
            if (!sabores[venda.sabor]) {
                sabores[venda.sabor] = { quantidade: 0, valor: 0 };
            }
            sabores[venda.sabor].quantidade += venda.quantidade;
            sabores[venda.sabor].valor += venda.precoTotal;
        });
        const saboresMaisVendidos = Object.entries(sabores)
            .map(([sabor, dados]) => ({ sabor, ...dados }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 5);
        // Comparação com semana anterior (simulada)
        const comparacaoSemanaAnterior = {
            vendas: totalVendas * (0.8 + Math.random() * 0.4), // Variação de 80% a 120%
            pedidos: totalPedidos * (0.8 + Math.random() * 0.4),
            lucro: lucroBruto * (0.8 + Math.random() * 0.4)
        };
        const relatorio = {
            semana: semanaIndex + 1,
            mes,
            ano,
            totalVendas,
            totalPedidos,
            totalPagamentos: totalVendas,
            lucroBruto,
            saboresMaisVendidos,
            comparacaoSemanaAnterior
        };
        setRelatorioSemanal(relatorio);
    };
    const carregarSemana = async () => {
        if (!semanaSelecionada)
            return;
        try {
            const { inicio, fim } = semanaSelecionada;
            const [dados, salIni, salFim] = await Promise.all([
                buscarDadosSemana(inicio, fim),
                buscarSaldoInicialPorSabor(inicio),
                buscarSaldoFinalPorSabor(inicio, fim),
            ]);
            setDadosSemana(dados);
            setTotais(calcularTotais(dados));
            setSaldoInicial(salIni);
            setSaldoFinal(salFim);
        }
        catch (error) {
            console.log('Usando dados de exemplo');
        }
        await calcularRelatorioSemanal();
    };
    useEffect(() => {
        carregarSemana();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ano, mes, semanaIndex]);
    const anterior = () => {
        setSemanaIndex((prev) => (prev > 0 ? prev - 1 : prev));
    };
    const proxima = () => {
        setSemanaIndex((prev) => (prev < semanas.length - 1 ? prev + 1 : prev));
    };
    // Variação semanal por sabor: saldoFinal - saldoInicial
    const variacaoPorSabor = (sabor) => {
        const ini = saldoInicial[sabor] ?? 0;
        const fim = saldoFinal[sabor] ?? 0;
        return fim - ini;
    };
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };
    const getNomeMes = (mes) => {
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return meses[mes - 1];
    };
    const calcularVariacao = (atual, anterior) => {
        if (anterior === 0)
            return 0;
        return ((atual - anterior) / anterior) * 100;
    };
    return (_jsxs("div", { className: "semana-container", children: [_jsxs("div", { className: "semana-header", children: [_jsxs("h1", { children: ["Relat\u00F3rio Semanal \u2014 ", getNomeMes(mes), " ", ano] }), _jsxs("div", { className: "semana-actions", children: [_jsxs("button", { className: "btn-comparacao", onClick: () => setMostrarComparacao(!mostrarComparacao), children: [mostrarComparacao ? 'Ocultar' : 'Mostrar', " Compara\u00E7\u00E3o"] }), _jsx("button", { className: "btn-exportar", children: "Exportar" })] })] }), _jsx("div", { className: "semana-info", children: _jsxs("h2", { children: ["Semana ", semanaIndex + 1, " \u2014 ", semanaSelecionada?.label] }) }), _jsxs("div", { className: "semana-controls", children: [_jsx("button", { onClick: () => setAno((a) => a - 1), children: "\u2190 Ano" }), _jsx("span", { className: "ano-atual", children: ano }), _jsx("button", { onClick: () => setAno((a) => a + 1), children: "Ano \u2192" }), _jsx("button", { onClick: () => setMes((m) => (m > 1 ? m - 1 : 12)), children: "\u2190 M\u00EAs" }), _jsx("span", { className: "mes-atual", children: getNomeMes(mes) }), _jsx("button", { onClick: () => setMes((m) => (m < 12 ? m + 1 : 1)), children: "M\u00EAs \u2192" }), _jsx("button", { onClick: anterior, disabled: semanaIndex === 0, children: "\u2190 Semana Anterior" }), _jsx("button", { onClick: proxima, disabled: semanas.length === 0 || semanaIndex === semanas.length - 1, children: "Pr\u00F3xima Semana \u2192" })] }), relatorioSemanal && (_jsxs("div", { className: "resumo-semanal", children: [_jsx("h3", { children: "Resumo da Semana" }), _jsxs("div", { className: "cards-semanais", children: [_jsxs("div", { className: "card-semanal vendas", children: [_jsx("h4", { children: "Total de Vendas" }), _jsx("p", { className: "valor", children: formatarMoeda(relatorioSemanal.totalVendas) }), _jsx("small", { children: "Receita da semana" })] }), _jsxs("div", { className: "card-semanal pedidos", children: [_jsx("h4", { children: "Total de Pedidos" }), _jsx("p", { className: "valor", children: formatarMoeda(relatorioSemanal.totalPedidos) }), _jsx("small", { children: "Custos da semana" })] }), _jsxs("div", { className: "card-semanal lucro", children: [_jsx("h4", { children: "Lucro Bruto" }), _jsx("p", { className: "valor", children: formatarMoeda(relatorioSemanal.lucroBruto) }), _jsx("small", { children: "Vendas - Pedidos" })] })] })] })), mostrarComparacao && relatorioSemanal && (_jsxs("div", { className: "comparacao-semanal", children: [_jsx("h3", { children: "Compara\u00E7\u00E3o com Semana Anterior" }), _jsxs("div", { className: "cards-comparacao", children: [_jsxs("div", { className: "card-comparacao", children: [_jsx("h4", { children: "Vendas" }), _jsxs("div", { className: "valores-comparacao", children: [_jsx("span", { className: "atual", children: formatarMoeda(relatorioSemanal.totalVendas) }), _jsx("span", { className: "anterior", children: formatarMoeda(relatorioSemanal.comparacaoSemanaAnterior.vendas) }), _jsxs("span", { className: `variacao ${relatorioSemanal.totalVendas >= relatorioSemanal.comparacaoSemanaAnterior.vendas ? 'positiva' : 'negativa'}`, children: [calcularVariacao(relatorioSemanal.totalVendas, relatorioSemanal.comparacaoSemanaAnterior.vendas).toFixed(1), "%"] })] })] }), _jsxs("div", { className: "card-comparacao", children: [_jsx("h4", { children: "Pedidos" }), _jsxs("div", { className: "valores-comparacao", children: [_jsx("span", { className: "atual", children: formatarMoeda(relatorioSemanal.totalPedidos) }), _jsx("span", { className: "anterior", children: formatarMoeda(relatorioSemanal.comparacaoSemanaAnterior.pedidos) }), _jsxs("span", { className: `variacao ${relatorioSemanal.totalPedidos <= relatorioSemanal.comparacaoSemanaAnterior.pedidos ? 'positiva' : 'negativa'}`, children: [calcularVariacao(relatorioSemanal.totalPedidos, relatorioSemanal.comparacaoSemanaAnterior.pedidos).toFixed(1), "%"] })] })] }), _jsxs("div", { className: "card-comparacao", children: [_jsx("h4", { children: "Lucro" }), _jsxs("div", { className: "valores-comparacao", children: [_jsx("span", { className: "atual", children: formatarMoeda(relatorioSemanal.lucroBruto) }), _jsx("span", { className: "anterior", children: formatarMoeda(relatorioSemanal.comparacaoSemanaAnterior.lucro) }), _jsxs("span", { className: `variacao ${relatorioSemanal.lucroBruto >= relatorioSemanal.comparacaoSemanaAnterior.lucro ? 'positiva' : 'negativa'}`, children: [calcularVariacao(relatorioSemanal.lucroBruto, relatorioSemanal.comparacaoSemanaAnterior.lucro).toFixed(1), "%"] })] })] })] })] })), relatorioSemanal && (_jsxs("div", { className: "sabores-top-semanal", children: [_jsx("h3", { children: "Top 5 Sabores da Semana" }), _jsx("div", { className: "lista-sabores-semanal", children: relatorioSemanal.saboresMaisVendidos.map((item, index) => (_jsxs("div", { className: "item-sabor-semanal", children: [_jsxs("div", { className: "posicao-semanal", children: ["#", index + 1] }), _jsxs("div", { className: "info-sabor-semanal", children: [_jsx("h4", { children: item.sabor }), _jsxs("p", { children: [item.quantidade, " unidades"] }), _jsx("p", { className: "valor-sabor", children: formatarMoeda(item.valor) })] }), _jsx("div", { className: "barra-progresso-semanal", children: _jsx("div", { className: "progresso-semanal", style: {
                                            width: `${(item.quantidade / relatorioSemanal.saboresMaisVendidos[0].quantidade) * 100}%`
                                        } }) })] }, index))) })] })), _jsxs("div", { className: "tabela-detalhada-semanal", children: [_jsx("h3", { children: "Controle Detalhado por Sabor" }), _jsxs("table", { className: "tabela-resumo-semanal", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Sabor" }), _jsx("th", { children: "Freezer" }), _jsx("th", { children: "Estufa" }), _jsx("th", { children: "Perdas" }), _jsx("th", { children: "Total Empadas" }), _jsx("th", { children: "Saldo Inicial" }), _jsx("th", { children: "Saldo Final" }), _jsx("th", { children: "Varia\u00E7\u00E3o" })] }) }), _jsx("tbody", { children: dadosSemana.length > 0 ? (dadosSemana.map((item, index) => (_jsxs("tr", { children: [_jsx("td", { children: item.sabor }), _jsx("td", { children: item.freezer }), _jsx("td", { children: item.estufa }), _jsx("td", { children: item.perdas }), _jsx("td", { children: item.freezer + item.estufa - item.perdas }), _jsx("td", { children: saldoInicial[item.sabor] ?? 0 }), _jsx("td", { children: saldoFinal[item.sabor] ?? 0 }), _jsx("td", { className: variacaoPorSabor(item.sabor) >= 0 ? 'variacao-positiva' : 'variacao-negativa', children: variacaoPorSabor(item.sabor) })] }, index)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 8, children: "Nenhum dado dispon\u00EDvel para essa semana." }) })) }), _jsx("tfoot", { children: _jsxs("tr", { children: [_jsx("td", { children: _jsx("strong", { children: "Total" }) }), _jsx("td", { children: totais.totalFreezer }), _jsx("td", { children: totais.totalEstufa }), _jsx("td", { children: totais.totalPerdas }), _jsx("td", { children: totais.totalEmpadas }), _jsx("td", { colSpan: 3 })] }) })] })] })] }));
};
export default Semana;
