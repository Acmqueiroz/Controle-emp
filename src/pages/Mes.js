import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { buscarDadosDoMes, calcularResumoMensal } from '../services/firebaseService';
import './Mes.css';
const Mes = () => {
    const hoje = new Date();
    const [ano, setAno] = useState(hoje.getFullYear());
    const [mes, setMes] = useState(hoje.getMonth() + 1);
    const [dias, setDias] = useState([]);
    const [totais, setTotais] = useState({ perdasTotais: 0, pedidosCaixas: 0, vendasEstimadas: 0 });
    const [relatorioMensal, setRelatorioMensal] = useState(null);
    const [mostrarGraficos, setMostrarGraficos] = useState(false);
    // Carregar dados reais do mês
    const carregarDadosReais = async () => {
        try {
            // Buscar dados de contagem diária do mês
            const inicioMes = new Date(ano, mes - 1, 1);
            const fimMes = new Date(ano, mes, 0);
            const contagemQuery = query(collection(db, 'contagem_diaria'), where('data', '>=', inicioMes.toISOString().split('T')[0]), where('data', '<=', fimMes.toISOString().split('T')[0]));
            const contagemSnapshot = await getDocs(contagemQuery);
            // Buscar pedidos do mês
            const pedidosQuery = query(collection(db, 'pedidos'), where('data', '>=', inicioMes), where('data', '<=', fimMes));
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
    const calcularRelatorioMensal = async () => {
        const { vendasReais, pedidosReais } = await carregarDadosReais();
        const totalVendas = vendasReais.reduce((acc, v) => acc + v.precoTotal, 0);
        const totalPedidos = pedidosReais.reduce((acc, p) => acc + p.precoTotal, 0);
        const lucroBruto = totalVendas - totalPedidos;
        const lucroLiquido = lucroBruto * 0.8; // Simulando despesas
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
        // Vendas por dia
        const vendasPorDia = Array.from({ length: 30 }, (_, i) => {
            const dia = i + 1;
            const vendasDia = vendasReais.filter(v => v.data.getDate() === dia);
            const pedidosDia = pedidosReais.filter(p => p.data.getDate() === dia);
            return {
                dia,
                vendas: vendasDia.reduce((acc, v) => acc + v.precoTotal, 0),
                pedidos: pedidosDia.reduce((acc, p) => acc + p.precoTotal, 0)
            };
        });
        const relatorio = {
            mes,
            ano,
            totalVendas,
            totalPedidos,
            totalPagamentos: totalVendas,
            lucroBruto,
            lucroLiquido,
            saboresMaisVendidos,
            vendasPorDia
        };
        setRelatorioMensal(relatorio);
    };
    const carregar = async () => {
        try {
            const { contagens, dias } = await buscarDadosDoMes(ano, mes);
            setDias(dias);
            setTotais(calcularResumoMensal(contagens));
        }
        catch (error) {
            console.log('Usando dados de exemplo');
            // Se não conseguir carregar do Firebase, usar dados de exemplo
        }
        await calcularRelatorioMensal();
    };
    useEffect(() => {
        carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ano, mes]);
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
    return (_jsxs("div", { className: "mes-container", children: [_jsxs("div", { className: "mes-header", children: [_jsxs("h1", { children: ["Relat\u00F3rio Mensal \u2014 ", getNomeMes(mes), " ", ano] }), _jsxs("div", { className: "mes-actions", children: [_jsxs("button", { className: "btn-graficos", onClick: () => setMostrarGraficos(!mostrarGraficos), children: [mostrarGraficos ? 'Ocultar' : 'Mostrar', " Gr\u00E1ficos"] }), _jsx("button", { className: "btn-exportar", children: "Exportar Relat\u00F3rio" })] })] }), _jsxs("div", { className: "mes-controls", children: [_jsx("button", { onClick: () => setAno((a) => a - 1), children: "\u2190 Ano" }), _jsx("span", { className: "ano-atual", children: ano }), _jsx("button", { onClick: () => setAno((a) => a + 1), children: "Ano \u2192" }), _jsx("button", { onClick: () => setMes((m) => (m > 1 ? m - 1 : 12)), children: "\u2190 M\u00EAs" }), _jsx("span", { className: "mes-atual", children: getNomeMes(mes) }), _jsx("button", { onClick: () => setMes((m) => (m < 12 ? m + 1 : 1)), children: "M\u00EAs \u2192" })] }), relatorioMensal && (_jsxs("div", { className: "resumo-financeiro-mensal", children: [_jsx("h2", { children: "Resumo Financeiro do M\u00EAs" }), _jsxs("div", { className: "cards-mensais", children: [_jsxs("div", { className: "card-mensal vendas", children: [_jsx("h3", { children: "Total de Vendas" }), _jsx("p", { className: "valor", children: formatarMoeda(relatorioMensal.totalVendas) }), _jsx("small", { children: "Receita bruta" })] }), _jsxs("div", { className: "card-mensal pedidos", children: [_jsx("h3", { children: "Total de Pedidos" }), _jsx("p", { className: "valor", children: formatarMoeda(relatorioMensal.totalPedidos) }), _jsx("small", { children: "Custos de produ\u00E7\u00E3o" })] }), _jsxs("div", { className: "card-mensal lucro-bruto", children: [_jsx("h3", { children: "Lucro Bruto" }), _jsx("p", { className: "valor", children: formatarMoeda(relatorioMensal.lucroBruto) }), _jsx("small", { children: "Vendas - Pedidos" })] }), _jsxs("div", { className: "card-mensal lucro-liquido", children: [_jsx("h3", { children: "Lucro L\u00EDquido" }), _jsx("p", { className: "valor", children: formatarMoeda(relatorioMensal.lucroLiquido) }), _jsx("small", { children: "Ap\u00F3s despesas" })] })] })] })), relatorioMensal && (_jsxs("div", { className: "sabores-top-mensal", children: [_jsx("h2", { children: "Top 5 Sabores Mais Vendidos" }), _jsx("div", { className: "lista-sabores-mensal", children: relatorioMensal.saboresMaisVendidos.map((item, index) => (_jsxs("div", { className: "item-sabor-mensal", children: [_jsxs("div", { className: "posicao-mensal", children: ["#", index + 1] }), _jsxs("div", { className: "info-sabor-mensal", children: [_jsx("h4", { children: item.sabor }), _jsxs("p", { children: [item.quantidade, " unidades vendidas"] }), _jsx("p", { className: "valor-sabor", children: formatarMoeda(item.valor) })] }), _jsx("div", { className: "barra-progresso", children: _jsx("div", { className: "progresso", style: {
                                            width: `${(item.quantidade / relatorioMensal.saboresMaisVendidos[0].quantidade) * 100}%`
                                        } }) })] }, index))) })] })), mostrarGraficos && relatorioMensal && (_jsxs("div", { className: "graficos-mensal", children: [_jsx("h2", { children: "Gr\u00E1fico de Vendas por Dia" }), _jsx("div", { className: "grafico-barras", children: relatorioMensal.vendasPorDia.map((dia, index) => (_jsxs("div", { className: "barra-dia", children: [_jsx("div", { className: "barra-vendas", style: {
                                        height: `${(dia.vendas / Math.max(...relatorioMensal.vendasPorDia.map(d => d.vendas))) * 200}px`
                                    } }), _jsx("span", { className: "label-dia", children: dia.dia }), _jsx("span", { className: "valor-dia", children: formatarMoeda(dia.vendas) })] }, index))) })] })), _jsxs("div", { className: "tabela-detalhada-mensal", children: [_jsx("h2", { children: "Controle Di\u00E1rio Detalhado" }), _jsxs("table", { className: "tabela-resumo-mensal", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Data" }), _jsx("th", { children: "Freezer" }), _jsx("th", { children: "Estufa" }), _jsx("th", { children: "Perdas" }), _jsx("th", { children: "Total Empadas" }), _jsx("th", { children: "Saldo Informado" }), _jsx("th", { children: "Diferen\u00E7a" }), _jsx("th", { children: "Pedido (caixas)" })] }) }), _jsx("tbody", { children: dias.length ? (dias.map((d) => (_jsxs("tr", { children: [_jsx("td", { children: d.data }), _jsx("td", { children: d.resumo?.totalFreezer ?? '-' }), _jsx("td", { children: d.resumo?.totalEstufa ?? '-' }), _jsx("td", { children: d.resumo?.totalPerdas ?? '-' }), _jsx("td", { children: d.resumo?.totalEmpadas ?? '-' }), _jsx("td", { children: d.resumo?.totalSaldoInformado ?? '-' }), _jsx("td", { children: d.resumo?.totalDiferenca ?? '-' }), _jsx("td", { children: d.resumo?.totalPedidoCaixas ?? '-' })] }, d.data)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 8, children: "Sem dados no m\u00EAs." }) })) }), _jsx("tfoot", { children: _jsxs("tr", { children: [_jsx("td", { children: _jsx("strong", { children: "Totais" }) }), _jsx("td", { colSpan: 2 }), _jsx("td", { children: totais.perdasTotais }), _jsx("td", {}), _jsx("td", {}), _jsx("td", { children: totais.vendasEstimadas }), _jsx("td", { children: totais.pedidosCaixas })] }) })] })] })] }));
};
export default Mes;
