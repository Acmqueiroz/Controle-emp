import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import './SistemaSugestoes.css';
const SistemaSugestoes = () => {
    const [sugestoes, setSugestoes] = useState([]);
    const [filtro, setFiltro] = useState('todas');
    const [ordenacao, setOrdenacao] = useState('prioridade');
    // Gerar dados de exemplo para análise
    const gerarDadosExemplo = () => {
        const vendasExemplo = [];
        const pedidosExemplo = [];
        // Gerar vendas dos últimos 30 dias
        for (let dia = 1; dia <= 30; dia++) {
            const quantidadeVendas = Math.floor(Math.random() * 10) + 1;
            for (let i = 0; i < quantidadeVendas; i++) {
                const sabores = ['FRANGO', 'CAMARÃO', 'QUEIJO', 'CARNE SECA', 'PALMITO', 'PIZZA', 'CHOCOLATE'];
                const sabor = sabores[Math.floor(Math.random() * sabores.length)];
                const tipo = Math.random() > 0.7 ? 'EMPADÃO' : 'EMPADA';
                const quantidade = Math.floor(Math.random() * 50) + 1;
                const precoUnidade = tipo === 'EMPADÃO' ?
                    (sabor === 'CAMARÃO' ? 7.07 : sabor === 'CARNE SECA' ? 6.97 : 5.00) :
                    (sabor === 'QUEIJO' ? 4.02 : sabor === 'CAMARÃO' ? 3.14 : sabor === 'CHOCOLATE' ? 2.85 : 2.59);
                vendasExemplo.push({
                    id: `${dia}-${i}`,
                    data: new Date(2024, 8, dia),
                    sabor,
                    tipo,
                    quantidade,
                    precoUnidade,
                    precoTotal: quantidade * precoUnidade,
                    formaPagamento: ['dinheiro', 'cartao', 'pix'][Math.floor(Math.random() * 3)]
                });
            }
        }
        return { vendasExemplo, pedidosExemplo };
    };
    const gerarSugestoes = () => {
        const { vendasExemplo, pedidosExemplo } = gerarDadosExemplo();
        // Analisar dados e gerar sugestões
        const novasSugestoes = [];
        // Análise de estoque
        const saboresVendidos = {};
        vendasExemplo.forEach(venda => {
            saboresVendidos[venda.sabor] = (saboresVendidos[venda.sabor] || 0) + venda.quantidade;
        });
        // Sugestão 1: Estoque baixo
        const saborMaisVendido = Object.entries(saboresVendidos)
            .sort(([, a], [, b]) => b - a)[0];
        if (saborMaisVendido) {
            novasSugestoes.push({
                id: 'estoque-1',
                tipo: 'estoque',
                titulo: 'Estoque Baixo - ' + saborMaisVendido[0],
                descricao: `O sabor ${saborMaisVendido[0]} é o mais vendido (${saborMaisVendido[1]} unidades/mês) mas tem estoque baixo.`,
                impacto: 'alto',
                acao: 'Aumentar produção de ' + saborMaisVendido[0] + ' em 30%',
                valorEstimado: 1500,
                prioridade: 1
            });
        }
        // Sugestão 2: Preço otimização
        const vendasPorPreco = vendasExemplo.reduce((acc, v) => {
            const faixa = v.precoUnidade < 3 ? 'baixo' : v.precoUnidade < 5 ? 'medio' : 'alto';
            acc[faixa] = (acc[faixa] || 0) + v.quantidade;
            return acc;
        }, {});
        if (vendasPorPreco.alto > vendasPorPreco.baixo) {
            novasSugestoes.push({
                id: 'preco-1',
                tipo: 'preco',
                titulo: 'Oportunidade de Preço Premium',
                descricao: 'Produtos de preço alto têm boa aceitação. Considere lançar novos sabores premium.',
                impacto: 'medio',
                acao: 'Desenvolver 2 novos sabores premium (R$ 6,00+)',
                valorEstimado: 2500,
                prioridade: 2
            });
        }
        // Sugestão 3: Produção
        const totalVendas = vendasExemplo.reduce((acc, v) => acc + v.quantidade, 0);
        const mediaDiaria = totalVendas / 30;
        if (mediaDiaria > 50) {
            novasSugestoes.push({
                id: 'producao-1',
                tipo: 'producao',
                titulo: 'Otimização de Produção',
                descricao: `Média de ${mediaDiaria.toFixed(1)} unidades/dia. Considere aumentar capacidade produtiva.`,
                impacto: 'medio',
                acao: 'Investir em equipamento adicional para aumentar produção em 25%',
                valorEstimado: 5000,
                prioridade: 3
            });
        }
        // Sugestão 4: Vendas
        const vendasPorDia = Array.from({ length: 7 }, (_, i) => {
            const dia = i + 1;
            return vendasExemplo.filter(v => v.data.getDay() === dia).length;
        });
        const diaMenorVenda = vendasPorDia.indexOf(Math.min(...vendasPorDia));
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        novasSugestoes.push({
            id: 'vendas-1',
            tipo: 'vendas',
            titulo: 'Oportunidade de Vendas - ' + diasSemana[diaMenorVenda],
            descricao: `${diasSemana[diaMenorVenda]} tem menor volume de vendas. Considere promoções específicas.`,
            impacto: 'baixo',
            acao: 'Criar promoção "Dia da Empada" nas ' + diasSemana[diaMenorVenda] + 's',
            valorEstimado: 800,
            prioridade: 4
        });
        // Sugestão 5: Lucro
        const lucroTotal = vendasExemplo.reduce((acc, v) => acc + v.precoTotal, 0);
        const margemEstimada = lucroTotal * 0.3; // 30% de margem
        if (margemEstimada < 2000) {
            novasSugestoes.push({
                id: 'lucro-1',
                tipo: 'lucro',
                titulo: 'Margem de Lucro Baixa',
                descricao: 'Margem de lucro está abaixo do ideal. Analise custos de produção.',
                impacto: 'alto',
                acao: 'Revisar fornecedores e otimizar receitas para reduzir custos em 15%',
                valorEstimado: 3000,
                prioridade: 1
            });
        }
        // Sugestão 6: Sazonalidade
        novasSugestoes.push({
            id: 'vendas-2',
            tipo: 'vendas',
            titulo: 'Preparação para Alta Temporada',
            descricao: 'Fim de ano se aproxima. Prepare estoque para aumento de 40% nas vendas.',
            impacto: 'medio',
            acao: 'Aumentar produção em 40% para dezembro e janeiro',
            valorEstimado: 4000,
            prioridade: 2
        });
        // Sugestão 7: Diversificação
        const saboresUnicos = new Set(vendasExemplo.map(v => v.sabor)).size;
        if (saboresUnicos < 10) {
            novasSugestoes.push({
                id: 'producao-2',
                tipo: 'producao',
                titulo: 'Diversificação de Sabores',
                descricao: `Apenas ${saboresUnicos} sabores diferentes. Diversificar pode aumentar vendas.`,
                impacto: 'baixo',
                acao: 'Desenvolver 3 novos sabores sazonais',
                valorEstimado: 1200,
                prioridade: 5
            });
        }
        setSugestoes(novasSugestoes);
    };
    useEffect(() => {
        gerarSugestoes();
    }, []);
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };
    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case 'estoque':
                return '📦';
            case 'preco':
                return '💰';
            case 'producao':
                return '🏭';
            case 'vendas':
                return '📈';
            case 'lucro':
                return '💎';
            default:
                return '💡';
        }
    };
    const getImpactoClass = (impacto) => {
        switch (impacto) {
            case 'alto':
                return 'impacto-alto';
            case 'medio':
                return 'impacto-medio';
            case 'baixo':
                return 'impacto-baixo';
            default:
                return '';
        }
    };
    const sugestoesFiltradas = sugestoes
        .filter(s => filtro === 'todas' || s.tipo === filtro)
        .sort((a, b) => {
        switch (ordenacao) {
            case 'prioridade':
                return a.prioridade - b.prioridade;
            case 'impacto':
                const ordemImpacto = { alto: 1, medio: 2, baixo: 3 };
                return ordemImpacto[a.impacto] - ordemImpacto[b.impacto];
            case 'tipo':
                return a.tipo.localeCompare(b.tipo);
            default:
                return 0;
        }
    });
    return (_jsxs("div", { className: "sugestoes-container", children: [_jsxs("div", { className: "sugestoes-header", children: [_jsx("h1", { children: "\uD83D\uDCA1 Sistema de Sugest\u00F5es Inteligentes" }), _jsx("p", { children: "An\u00E1lise baseada nos seus dados de vendas e produ\u00E7\u00E3o" })] }), _jsxs("div", { className: "sugestoes-filtros", children: [_jsxs("div", { className: "filtro-tipo", children: [_jsx("label", { children: "Filtrar por tipo:" }), _jsxs("select", { value: filtro, onChange: (e) => setFiltro(e.target.value), children: [_jsx("option", { value: "todas", children: "Todas as sugest\u00F5es" }), _jsx("option", { value: "estoque", children: "\uD83D\uDCE6 Estoque" }), _jsx("option", { value: "preco", children: "\uD83D\uDCB0 Pre\u00E7o" }), _jsx("option", { value: "producao", children: "\uD83C\uDFED Produ\u00E7\u00E3o" }), _jsx("option", { value: "vendas", children: "\uD83D\uDCC8 Vendas" }), _jsx("option", { value: "lucro", children: "\uD83D\uDC8E Lucro" })] })] }), _jsxs("div", { className: "filtro-ordenacao", children: [_jsx("label", { children: "Ordenar por:" }), _jsxs("select", { value: ordenacao, onChange: (e) => setOrdenacao(e.target.value), children: [_jsx("option", { value: "prioridade", children: "Prioridade" }), _jsx("option", { value: "impacto", children: "Impacto" }), _jsx("option", { value: "tipo", children: "Tipo" })] })] })] }), _jsx("div", { className: "sugestoes-grid", children: sugestoesFiltradas.map((sugestao) => (_jsxs("div", { className: `sugestao-card ${getImpactoClass(sugestao.impacto)}`, children: [_jsxs("div", { className: "sugestao-header", children: [_jsxs("div", { className: "sugestao-tipo", children: [_jsx("span", { className: "tipo-icon", children: getTipoIcon(sugestao.tipo) }), _jsx("span", { className: "tipo-nome", children: sugestao.tipo.toUpperCase() })] }), _jsxs("div", { className: "sugestao-prioridade", children: ["Prioridade #", sugestao.prioridade] })] }), _jsxs("div", { className: "sugestao-content", children: [_jsx("h3", { children: sugestao.titulo }), _jsx("p", { children: sugestao.descricao }), _jsxs("div", { className: "sugestao-acao", children: [_jsx("h4", { children: "\uD83D\uDCA1 A\u00E7\u00E3o Recomendada:" }), _jsx("p", { children: sugestao.acao })] }), sugestao.valorEstimado && (_jsxs("div", { className: "sugestao-valor", children: [_jsx("h4", { children: "\uD83D\uDCB0 Impacto Financeiro Estimado:" }), _jsxs("p", { className: "valor-positivo", children: ["+", formatarMoeda(sugestao.valorEstimado)] })] })), _jsx("div", { className: "sugestao-impacto", children: _jsxs("span", { className: `badge-impacto ${getImpactoClass(sugestao.impacto)}`, children: ["Impacto ", sugestao.impacto] }) })] }), _jsxs("div", { className: "sugestao-actions", children: [_jsx("button", { className: "btn-implementar", children: "Implementar" }), _jsx("button", { className: "btn-detalhes", children: "Ver Detalhes" }), _jsx("button", { className: "btn-dispensar", children: "Dispensar" })] })] }, sugestao.id))) }), sugestoesFiltradas.length === 0 && (_jsxs("div", { className: "sem-sugestoes", children: [_jsx("h3", { children: "\uD83C\uDF89 Nenhuma sugest\u00E3o encontrada!" }), _jsx("p", { children: "Seus dados est\u00E3o otimizados ou n\u00E3o h\u00E1 sugest\u00F5es para o filtro selecionado." })] })), _jsxs("div", { className: "sugestoes-resumo", children: [_jsx("h3", { children: "\uD83D\uDCCA Resumo das Sugest\u00F5es" }), _jsxs("div", { className: "resumo-cards", children: [_jsxs("div", { className: "resumo-card", children: [_jsx("h4", { children: "Total de Sugest\u00F5es" }), _jsx("p", { children: sugestoes.length })] }), _jsxs("div", { className: "resumo-card", children: [_jsx("h4", { children: "Alto Impacto" }), _jsx("p", { children: sugestoes.filter(s => s.impacto === 'alto').length })] }), _jsxs("div", { className: "resumo-card", children: [_jsx("h4", { children: "Valor Total Estimado" }), _jsx("p", { children: formatarMoeda(sugestoes.reduce((acc, s) => acc + (s.valorEstimado || 0), 0)) })] })] })] })] }));
};
export default SistemaSugestoes;
