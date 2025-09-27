import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, query, where, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import './ControleDiario.css';

// Sabores específicos para cada tipo de produto
const SABORES_EMPADA = [
    '4 Queijos', 'Bacalhau', 'Banana', 'Calabresa', 'Camarão', 'Camarão com Requeijão',
    'Carne Seca', 'Carne Seca com Requeijão', 'Chocolate', 'Frango',
    'Frango com Ameixa e Bacon', 'Frango com Azeitona', 'Frango com Bacon',
    'Frango com Cheddar', 'Frango com Palmito', 'Frango com Requeijão',
    'Palmito', 'Pizza', 'Queijo', 'Queijo com Alho', 'Queijo com Cebola', 'Romeu e Julieta'
];

const SABORES_EMPADAO = [
    'Camarão', 'Carne Seca', 'Frango', 'Frango com Azeitona', 'Frango com Requeijão'
];

const CAPACIDADE_FREEZER_CAIXAS = 52;
const ITENS_POR_CAIXA = 18;

// Preços baseados na tabela de preços (valores de custo para pedidos)
const PRECOS_PEDIDO = {
    '4 Queijos': { empada: 2.75, empadao: 0 },
    'Bacalhau': { empada: 2.75, empadao: 0 },
    'Banana': { empada: 2.40, empadao: 0 },
    'Calabresa': { empada: 2.58, empadao: 0 },
    'Camarão': { empada: 3.14, empadao: 7.07 },
    'Camarão com Requeijão': { empada: 3.18, empadao: 0 },
    'Carne Seca': { empada: 3.54, empadao: 6.97 },
    'Carne Seca com Requeijão': { empada: 3.39, empadao: 0 },
    'Chocolate': { empada: 2.85, empadao: 0 },
    'Frango': { empada: 2.59, empadao: 5.00 },
    'Frango com Ameixa e Bacon': { empada: 3.07, empadao: 0 },
    'Frango com Azeitona': { empada: 2.95, empadao: 5.63 },
    'Frango com Bacon': { empada: 2.99, empadao: 0 },
    'Frango com Cheddar': { empada: 2.75, empadao: 0 },
    'Frango com Palmito': { empada: 2.99, empadao: 0 },
    'Frango com Requeijão': { empada: 2.69, empadao: 5.10 },
    'Palmito': { empada: 3.00, empadao: 0 },
    'Pizza': { empada: 2.55, empadao: 0 },
    'Queijo': { empada: 4.02, empadao: 0 },
    'Queijo com Alho': { empada: 3.77, empadao: 0 },
    'Queijo com Cebola': { empada: 2.69, empadao: 0 },
    'Romeu e Julieta': { empada: 3.31, empadao: 0 }
};

const numberOrZero = (value) => {
    return typeof value === 'number' ? value : Number(value) || 0;
};

// Componente para tabela de controle
const TabelaControle = ({ tipoProduto, linhas, pedidoCaixas, recebidoHoje, saldoAnteriorPorSabor, mostrarPedido, alterarLinha, alterarPedido, alterarRecebido, totais }) => {
    return (_jsxs("table", { className: "tabela-controle", children: [
        _jsx("thead", { children: _jsxs("tr", { children: [
            _jsx("th", { children: "Sabor" }),
            _jsx("th", { children: "Saldo anterior" }),
            _jsx("th", { children: "Recebido" }),
            _jsx("th", { children: "Freezer" }),
            _jsx("th", { children: "Estufa" }),
            _jsx("th", { children: "Perdas" }),
            _jsx("th", { children: "Total" }),
            _jsx("th", { children: "Vendas" }),
            mostrarPedido && _jsx("th", { children: "Pedido (caixas)" }),
            mostrarPedido && _jsx("th", { children: "Preço Unit." }),
            mostrarPedido && _jsx("th", { children: "Valor Total" }),
            mostrarPedido && _jsx("th", { children: "Estoque Próximo Dia" })
        ] }) }),
        _jsx("tbody", { children: linhas.map((it, index) => {
            const freezer = numberOrZero(it.freezer);
            const estufa = numberOrZero(it.estufa);
            const perdas = numberOrZero(it.perdas);
            const total = freezer + estufa - perdas;
            const saldoAnt = saldoAnteriorPorSabor[it.sabor] || 0;
            const vendas = Math.max(0, saldoAnt - total);
            const saldoPrevisto = saldoAnt + (pedidoCaixas[index] || 0) * ITENS_POR_CAIXA - vendas;
            const precoUnitario = PRECOS_PEDIDO[it.sabor]?.[tipoProduto] || 0;
            const valorTotalPedido = vendas * precoUnitario;
            
            return (_jsxs("tr", { children: [
                _jsx("td", { children: it.sabor }),
                _jsx("td", { children: _jsx("input", { className: "input-ro", readOnly: true, value: saldoAnt }) }),
                _jsx("td", { children: _jsx("input", { className: "input-editavel no-spinner", type: "number", inputMode: "numeric", placeholder: "", value: recebidoHoje[index], onChange: (e) => alterarRecebido(index, e.target.value), min: 0, style: { width: 70 } }) }),
                _jsx("td", { children: _jsx("input", { className: "input-editavel no-spinner", type: "number", inputMode: "numeric", placeholder: "", min: 0, value: it.freezer, onChange: (e) => {
                    const n = e.currentTarget.valueAsNumber;
                    alterarLinha(index, 'freezer', Number.isNaN(n) ? '' : n);
                }, style: { width: 70 } }) }),
                _jsx("td", { children: _jsx("input", { className: "input-editavel no-spinner", type: "number", inputMode: "numeric", placeholder: "", min: 0, value: it.estufa, onChange: (e) => {
                    const n = e.currentTarget.valueAsNumber;
                    alterarLinha(index, 'estufa', Number.isNaN(n) ? '' : n);
                }, style: { width: 70 } }) }),
                _jsx("td", { children: _jsx("input", { className: "input-editavel no-spinner", type: "number", inputMode: "numeric", placeholder: "", min: 0, value: it.perdas, onChange: (e) => {
                    const n = e.currentTarget.valueAsNumber;
                    alterarLinha(index, 'perdas', Number.isNaN(n) ? '' : n);
                }, style: { width: 70 } }) }),
                _jsx("td", { children: _jsx("input", { className: "input-ro", readOnly: true, value: total }) }),
                _jsx("td", { children: _jsx("input", { className: "input-ro", readOnly: true, value: vendas }) }),
                mostrarPedido && (_jsxs(_Fragment, { children: [
                    _jsx("td", { children: _jsx("input", { className: "input-editavel no-spinner", type: "number", inputMode: "numeric", placeholder: "", min: 0, value: pedidoCaixas[index], onChange: (e) => {
                        const n = e.currentTarget.valueAsNumber;
                        alterarPedido(index, Number.isNaN(n) ? '' : n);
                    }, style: { width: 70 } }) }),
                    _jsx("td", { children: _jsx("input", { className: "input-ro", readOnly: true, value: `R$ ${precoUnitario.toFixed(2)}` }) }),
                    _jsx("td", { children: _jsx("input", { className: "input-ro", readOnly: true, value: `R$ ${valorTotalPedido.toFixed(2)}` }) }),
                    _jsx("td", { children: _jsx("input", { className: "input-ro", readOnly: true, value: saldoPrevisto }) })
                ] }))
            ] }, index));
        }) }),
        _jsxs("tfoot", { children: [
            _jsxs("tr", { children: [
                _jsx("td", { children: _jsx("strong", { children: "Total" }) }),
                _jsx("td", { children: totais.totalSaldoAnterior }),
                _jsx("td", { children: totais.totalRecebido }),
                _jsx("td", { children: totais.totalFreezer }),
                _jsx("td", { children: totais.totalEstufa }),
                _jsx("td", { children: totais.totalPerdas }),
                _jsx("td", { children: totais.totalEmpadas }),
                _jsx("td", { children: totais.vendasDia }),
                mostrarPedido && _jsx("td", { children: totais.totalPedido }),
                mostrarPedido && _jsx("td", { children: "-" }),
                mostrarPedido && _jsxs("td", { children: ["R$ ", totais.valorTotalPedido.toFixed(2)] }),
                mostrarPedido && _jsx("td", { children: totais.totalPedidoUnidades })
            ] }),
            _jsxs("tr", { style: { backgroundColor: '#f0f0f0', fontWeight: 'bold' }, children: [
                _jsx("td", { children: _jsx("strong", { children: "Resumo" }) }),
                _jsx("td", { colSpan: 5 }),
                _jsx("td", { children: _jsxs("strong", { children: ["Caixas: ", totais.totalEmpadasCaixas] }) }),
                _jsx("td", { children: _jsxs("strong", { children: ["Valor Vendas: R$ ", (totais.vendasDia * 7.00).toFixed(2)] }) }),
                mostrarPedido && _jsx("td", { colSpan: 4 })
            ] })
        ] })
    ] }));
};

const ControleDiario = () => {
    const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
    const [mostrarPedido, setMostrarPedido] = useState(true);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [documentoId, setDocumentoId] = useState(null);
    const [carregando, setCarregando] = useState(false);
    
    // Função para calcular totais por tipo de produto
    const calcularTotaisPorTipo = (tipo) => {
        const sabores = tipo === 'empada' ? SABORES_EMPADA : SABORES_EMPADAO;
        const inicioIndex = tipo === 'empada' ? 0 : SABORES_EMPADA.length;
        const fimIndex = tipo === 'empada' ? SABORES_EMPADA.length : SABORES_EMPADA.length + SABORES_EMPADAO.length;
        const linhasTipo = linhas.slice(inicioIndex, fimIndex);
        const pedidoCaixasTipo = pedidoCaixas.slice(inicioIndex, fimIndex);
        const recebidoHojeTipo = recebidoHoje.slice(inicioIndex, fimIndex);
        const totalFreezer = linhasTipo.reduce((acc, it) => acc + numberOrZero(it.freezer), 0);
        const totalEstufa = linhasTipo.reduce((acc, it) => acc + numberOrZero(it.estufa), 0);
        const totalPerdas = linhasTipo.reduce((acc, it) => acc + numberOrZero(it.perdas), 0);
        const totalEmpadas = totalFreezer + totalEstufa - totalPerdas;
        const totalEmpadasCaixas = Math.floor(totalEmpadas / ITENS_POR_CAIXA);
        let totalRecebido = 0;
        recebidoHojeTipo.forEach(v => {
            const valor = typeof v === 'number' ? v : (Number(v) || 0);
            totalRecebido += valor;
        });
        const totalSaldoAnterior = sabores.reduce((acc, s) => acc + (saldoAnteriorPorSabor[s] || 0), 0);
        const vendasDia = Math.max(0, totalSaldoAnterior - totalEmpadas);
        const valorTotalPedido = pedidoCaixasTipo.reduce((acc, caixas, index) => {
            if (caixas > 0) {
                const sabor = sabores[index];
                const preco = PRECOS_PEDIDO[sabor]?.[tipo] || 0;
                return acc + (caixas * ITENS_POR_CAIXA * preco);
            }
            return acc;
        }, 0);
        const totalPedido = pedidoCaixasTipo.reduce((acc, v) => acc + v, 0);
        const totalPedidoUnidades = totalPedido * ITENS_POR_CAIXA;
        return {
            totalFreezer,
            totalEstufa,
            totalPerdas,
            totalEmpadas,
            totalEmpadasCaixas,
            totalRecebido,
            totalSaldoAnterior,
            vendasDia,
            valorTotalPedido,
            totalPedido,
            totalPedidoUnidades
        };
    };
    
    // Calcular totais combinados (Empada + Empadão)
    const calcularTotaisCombinados = () => {
        const totaisEmpada = calcularTotaisPorTipo('empada');
        const totaisEmpadao = calcularTotaisPorTipo('empadao');
        return {
            totalSaldoAnterior: totaisEmpada.totalSaldoAnterior + totaisEmpadao.totalSaldoAnterior,
            totalRecebido: totaisEmpada.totalRecebido + totaisEmpadao.totalRecebido,
            vendasDia: totaisEmpada.vendasDia + totaisEmpadao.vendasDia,
            totalFreezer: totaisEmpada.totalFreezer + totaisEmpadao.totalFreezer,
            totalEstufa: totaisEmpada.totalEstufa + totaisEmpadao.totalEstufa,
            totalPerdas: totaisEmpada.totalPerdas + totaisEmpadao.totalPerdas,
            totalEmpadas: totaisEmpada.totalEmpadas + totaisEmpadao.totalEmpadas,
            totalEmpadasCaixas: totaisEmpada.totalEmpadasCaixas + totaisEmpadao.totalEmpadasCaixas,
            totalPedido: totaisEmpada.totalPedido + totaisEmpadao.totalPedido,
            valorTotalPedido: totaisEmpada.valorTotalPedido + totaisEmpadao.valorTotalPedido,
            totalPedidoUnidades: totaisEmpada.totalPedidoUnidades + totaisEmpadao.totalPedidoUnidades
        };
    };
    
    // Iniciar campos vazios para digitação (incluindo ambos os tipos)
    const [linhas, setLinhas] = useState([]);
    const [pedidoCaixas, setPedidoCaixas] = useState([]);
    const [recebidoHoje, setRecebidoHoje] = useState([]);
    const [saldoAnteriorPorSabor, setSaldoAnteriorPorSabor] = useState({});
    
    // Função para carregar dados existentes do dia selecionado
    const carregarDadosDoDia = async (dataSelecionada) => {
        setCarregando(true);
        try {
            const contagemQuery = query(collection(db, 'contagem_diaria'), where('data', '==', dataSelecionada));
            const contagemSnapshot = await getDocs(contagemQuery);
            if (!contagemSnapshot.empty) {
                const docData = contagemSnapshot.docs[0].data();
                setDocumentoId(contagemSnapshot.docs[0].id);
                setModoEdicao(true);
                // Carregar dados existentes
                const todosSabores = [...SABORES_EMPADA, ...SABORES_EMPADAO];
                setLinhas(docData.itens || todosSabores.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
                setPedidoCaixas(docData.pedidoCaixas || todosSabores.map(() => 0));
                setRecebidoHoje(docData.recebidoHoje || todosSabores.map(() => ''));
                // Sempre carregar saldo anterior do dia anterior (não usar saldoAnteriorPorSabor do dia atual)
                await carregarSaldoAnterior(dataSelecionada);
            } else {
                // Não existe registro para esta data, carregar dados do dia anterior
                setModoEdicao(false);
                setDocumentoId(null);
                await carregarDadosAnteriores(dataSelecionada);
            }
        } catch (error) {
            setModoEdicao(false);
            setDocumentoId(null);
        } finally {
            setCarregando(false);
        }
    };
    
    // Função para carregar saldo anterior do dia anterior
    const carregarSaldoAnterior = async (dataSelecionada) => {
        try {
            // Lógica simples: subtrair 1 dia da data selecionada
            const dataAtual = new Date(dataSelecionada);
            dataAtual.setDate(dataAtual.getDate() - 1);
            const dataAnteriorStr = dataAtual.toISOString().split('T')[0];
            
            // Buscar dados do dia anterior
            const contagemQuery = query(collection(db, 'contagem_diaria'), where('data', '==', dataAnteriorStr));
            const contagemSnapshot = await getDocs(contagemQuery);
            if (!contagemSnapshot.empty) {
                const docData = contagemSnapshot.docs[0].data();
                const saboresAtuais = [...SABORES_EMPADA, ...SABORES_EMPADAO];
                const saldoAnterior = {};
                
                // Usar o saldoAnteriorPorSabor salvo do dia anterior (que contém o saldo previsto correto)
                if (docData.saldoAnteriorPorSabor && typeof docData.saldoAnteriorPorSabor === 'object') {
                    // Usar diretamente o saldoAnteriorPorSabor salvo (que já contém o saldo previsto correto)
                    Object.keys(docData.saldoAnteriorPorSabor).forEach(sabor => {
                        if (saboresAtuais.includes(sabor)) {
                            saldoAnterior[sabor] = docData.saldoAnteriorPorSabor[sabor];
                        }
                    });
                } else {
                    // Fallback: calcular baseado nos dados reais do dia anterior
                    if (docData.itens && Array.isArray(docData.itens)) {
                        docData.itens.forEach((item, index) => {
                            if (saboresAtuais.includes(item.sabor)) {
                                const freezer = numberOrZero(typeof item.freezer === 'string' ? (item.freezer === '' ? '' : Number(item.freezer)) : item.freezer);
                                const estufa = numberOrZero(typeof item.estufa === 'string' ? (item.estufa === '' ? '' : Number(item.estufa)) : item.estufa);
                                const perdas = numberOrZero(typeof item.perdas === 'string' ? (item.perdas === '' ? '' : Number(item.perdas)) : item.perdas);
                                const total = freezer + estufa - perdas;
                                // Verificar se pedidoCaixas existe e tem o índice correto
                                const pedidoCaixas = (docData.pedidoCaixas && Array.isArray(docData.pedidoCaixas) && docData.pedidoCaixas[index] !== undefined)
                                    ? docData.pedidoCaixas[index]
                                    : 0;
                                const pedidoUnidades = pedidoCaixas * ITENS_POR_CAIXA;
                                // Calcular vendas baseado na diferença entre saldo anterior e estoque atual
                                const saldoAntAnterior = docData.saldoAnteriorPorSabor?.[item.sabor] || 0;
                                const vendas = Math.max(0, saldoAntAnterior - total);
                                // Saldo próximo dia = estoque atual + pedidos - vendas
                                const saldoPrevisto = total + pedidoUnidades - vendas;
                                saldoAnterior[item.sabor] = saldoPrevisto;
                            }
                        });
                    }
                }
                setSaldoAnteriorPorSabor(saldoAnterior);
            } else {
                // Se não há dados do dia anterior, tentar buscar o último registro disponível
                const ultimoRegistroQuery = query(collection(db, 'contagem_diaria'), where('data', '<', dataSelecionada), orderBy('data', 'desc'), limit(1));
                const ultimoRegistroSnapshot = await getDocs(ultimoRegistroQuery);
                if (!ultimoRegistroSnapshot.empty) {
                    const docData = ultimoRegistroSnapshot.docs[0].data();
                    const saboresAtuais = [...SABORES_EMPADA, ...SABORES_EMPADAO];
                    const saldoAnterior = {};
                    // Calcular saldo real baseado nos dados do último registro (sem pedidos)
                    if (docData.itens && Array.isArray(docData.itens)) {
                        docData.itens.forEach((item, index) => {
                            if (saboresAtuais.includes(item.sabor)) {
                                const freezer = numberOrZero(typeof item.freezer === 'string' ? (item.freezer === '' ? '' : Number(item.freezer)) : item.freezer);
                                const estufa = numberOrZero(typeof item.estufa === 'string' ? (item.estufa === '' ? '' : Number(item.estufa)) : item.estufa);
                                const perdas = numberOrZero(typeof item.perdas === 'string' ? (item.perdas === '' ? '' : Number(item.perdas)) : item.perdas);
                                const saldoReal = freezer + estufa - perdas; // Apenas o saldo real, sem pedidos
                                saldoAnterior[item.sabor] = saldoReal;
                            }
                        });
                    } else {
                        // Fallback: calcular baseado no total + pedidos
                        if (docData.itens && Array.isArray(docData.itens)) {
                            docData.itens.forEach((item, index) => {
                                if (saboresAtuais.includes(item.sabor)) {
                                    const freezer = numberOrZero(typeof item.freezer === 'string' ? (item.freezer === '' ? '' : Number(item.freezer)) : item.freezer);
                                    const estufa = numberOrZero(typeof item.estufa === 'string' ? (item.estufa === '' ? '' : Number(item.estufa)) : item.estufa);
                                    const perdas = numberOrZero(typeof item.perdas === 'string' ? (item.perdas === '' ? '' : Number(item.perdas)) : item.perdas);
                                    const total = freezer + estufa - perdas;
                                    const pedidoCaixas = (docData.pedidoCaixas && Array.isArray(docData.pedidoCaixas) && docData.pedidoCaixas[index] !== undefined)
                                        ? docData.pedidoCaixas[index]
                                        : 0;
                                    const saldoPrevisto = total + (pedidoCaixas * ITENS_POR_CAIXA);
                                    saldoAnterior[item.sabor] = saldoPrevisto;
                                }
                            });
                        }
                    }
                    setSaldoAnteriorPorSabor(saldoAnterior);
                } else {
                    // Se não há nenhum dado anterior, iniciar com saldo zerado
                    setSaldoAnteriorPorSabor({});
                }
            }
        } catch (error) {
            setSaldoAnteriorPorSabor({});
        }
    };
    
    // Função para carregar dados do dia anterior
    const carregarDadosAnteriores = async (dataSelecionada) => {
        // Carregar saldo anterior do dia anterior
        await carregarSaldoAnterior(dataSelecionada);
        // Inicializar campos vazios para ambos os tipos
        const todosSabores = [...SABORES_EMPADA, ...SABORES_EMPADAO];
        setLinhas(todosSabores.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
        setPedidoCaixas(todosSabores.map(() => 0));
        setRecebidoHoje(todosSabores.map(() => ''));
    };
    
    useEffect(() => {
        carregarDadosDoDia(data);
    }, [data]);
    
    // Inicializar campos quando não está em modo de edição
    useEffect(() => {
        if (!modoEdicao && linhas.length === 0) {
            const todosSabores = [...SABORES_EMPADA, ...SABORES_EMPADAO];
            setLinhas(todosSabores.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
            setPedidoCaixas(todosSabores.map(() => 0));
            setRecebidoHoje(todosSabores.map(() => ''));
        }
    }, [modoEdicao, linhas.length]);
    
    const alterarLinha = (index, campo, valor) => {
        const coerced = valor === '' ? '' : Number(valor);
        setLinhas((prev) => prev.map((it, i) => (i === index ? { ...it, [campo]: coerced } : it)));
    };
    
    const alterarPedido = (index, valor) => {
        const coerced = valor === '' ? 0 : Number(valor) || 0;
        setPedidoCaixas((prev) => prev.map((v, i) => (i === index ? coerced : v)));
    };
    
    const alterarRecebido = (index, valor) => {
        const coerced = valor === '' ? '' : Number(valor) || 0;
        setRecebidoHoje((prev) => prev.map((v, i) => (i === index ? coerced : v)));
    };
    
    const salvar = async () => {
        setCarregando(true);
        try {
            const totaisCombinados = calcularTotaisCombinados();
            // Calcular saldo para o próximo dia (baseado no estoque atual + pedidos)
            const saldoProximoDia = {};
            const todosSaboresSaldo = [...SABORES_EMPADA, ...SABORES_EMPADAO];
            linhas.forEach((item, index) => {
                if (todosSaboresSaldo.includes(item.sabor)) {
                    const freezer = numberOrZero(item.freezer);
                    const estufa = numberOrZero(item.estufa);
                    const perdas = numberOrZero(item.perdas);
                    const total = freezer + estufa - perdas;
                    const pedidoCaixasItem = pedidoCaixas[index] || 0;
                    const pedidoUnidades = pedidoCaixasItem * ITENS_POR_CAIXA;
                    const saldoAnt = saldoAnteriorPorSabor[item.sabor] || 0;
                    const vendas = Math.max(0, saldoAnt - total);
                    // Saldo próximo dia = estoque atual + pedidos - vendas
                    saldoProximoDia[item.sabor] = total + pedidoUnidades - vendas;
                }
            });
            
            const resumo = {
                totalFreezer: totaisCombinados.totalFreezer,
                totalEstufa: totaisCombinados.totalEstufa,
                totalPerdas: totaisCombinados.totalPerdas,
                totalEmpadas: totaisCombinados.totalEmpadas,
                totalPedidoCaixas: totaisCombinados.totalPedido,
                capacidadeFreezerCaixas: CAPACIDADE_FREEZER_CAIXAS,
                capacidadeOcupadaCaixas: Math.floor(totaisCombinados.totalEmpadas / ITENS_POR_CAIXA),
                capacidadeRestanteCaixas: CAPACIDADE_FREEZER_CAIXAS - Math.floor(totaisCombinados.totalEmpadas / ITENS_POR_CAIXA),
                vendasDia: totaisCombinados.vendasDia,
                recebidoUnidades: totaisCombinados.totalRecebido,
                saldoAnteriorUnidades: totaisCombinados.totalSaldoAnterior,
                valorTotalPedido: totaisCombinados.valorTotalPedido,
            };
            
            // Criar pedidos para o sistema de custos (ambos os tipos)
            const todosSabores = [...SABORES_EMPADA, ...SABORES_EMPADAO];
            const pedidos = pedidoCaixas.map((caixas, index) => {
                if (caixas > 0) {
                    const sabor = todosSabores[index];
                    const tipoProduto = index < SABORES_EMPADA.length ? 'empada' : 'empadao';
                    const preco = PRECOS_PEDIDO[sabor]?.[tipoProduto] || 0;
                    const unidades = caixas * ITENS_POR_CAIXA;
                    return {
                        id: `${data}-${sabor}-${index}`,
                        data: new Date(data),
                        sabor,
                        tipo: tipoProduto.toUpperCase(),
                        quantidade: unidades,
                        precoUnidade: preco,
                        precoTotal: unidades * preco,
                        fornecedor: 'Fornecedor Principal',
                        status: 'pendente'
                    };
                }
                return null;
            }).filter(Boolean);
            
            if (modoEdicao && documentoId) {
                // Atualizar documento existente
                const docRef = doc(db, 'contagem_diaria', documentoId);
                await updateDoc(docRef, {
                    itens: linhas,
                    pedidoCaixas,
                    recebidoHoje,
                    resumo,
                    pedidos,
                    saldoAnteriorPorSabor: saldoProximoDia,
                    dataAtualizacao: new Date()
                });
                alert(`Registro atualizado! ${pedidos.length > 0 ? `Pedido de R$ ${totaisCombinados.valorTotalPedido.toFixed(2)} enviado para controle de custos.` : ''}`);
            } else {
                // Criar novo documento
                const empadasCollection = collection(db, 'contagem_diaria');
                await addDoc(empadasCollection, {
                    data,
                    itens: linhas,
                    pedidoCaixas,
                    recebidoHoje,
                    resumo,
                    pedidos,
                    saldoAnteriorPorSabor: saldoProximoDia,
                    dataCriacao: new Date()
                });
                alert(`Contagem salva! ${pedidos.length > 0 ? `Pedido de R$ ${totaisCombinados.valorTotalPedido.toFixed(2)} enviado para controle de custos.` : ''}`);
            }
            
            // Salvar pedidos no sistema de custos (apenas se não estiver editando)
            if (pedidos.length > 0 && !modoEdicao) {
                const pedidosCollection = collection(db, 'pedidos');
                for (const pedido of pedidos) {
                    await addDoc(pedidosCollection, pedido);
                }
            }
            
            // Atualizar estado para modo de edição
            setModoEdicao(true);
        } catch (error) {
            alert('Erro ao salvar os dados. Tente novamente.');
        } finally {
            setCarregando(false);
        }
    };
    
    const limparDados = () => {
        const todosSabores = [...SABORES_EMPADA, ...SABORES_EMPADAO];
        setLinhas(todosSabores.map((sabor) => ({ sabor, freezer: '', estufa: '', perdas: '' })));
        setPedidoCaixas(todosSabores.map(() => 0));
        setRecebidoHoje(todosSabores.map(() => ''));
        setModoEdicao(false);
        setDocumentoId(null);
    };
    
    return (_jsxs("div", { className: "container", children: [
        _jsxs("h1", { children: ["Controle Diário ", modoEdicao && _jsx("span", { style: { color: '#f39c12', fontSize: '0.8em' }, children: "(Editando)" })] }),
        _jsxs("div", { className: "controls", style: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }, children: [
            _jsxs("label", { children: ["Data:", _jsx("input", { type: "date", value: data, onChange: (e) => setData(e.target.value), disabled: carregando })] }),
            _jsx("button", { onClick: () => setMostrarPedido((v) => !v), disabled: carregando, children: mostrarPedido ? 'Ocultar Pedido' : 'Mostrar Pedido' }),
            (modoEdicao || linhas.some(linha => linha.freezer !== '' || linha.estufa !== '' || linha.perdas !== '')) && (_jsx("button", { onClick: limparDados, style: { background: '#e74c3c' }, disabled: carregando, children: "Limpar Dados" }))
        ] }),
        carregando && (_jsx("div", { style: { textAlign: 'center', padding: '20px', color: '#3498db' }, children: "Carregando dados..." })),
        _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, margin: '12px 0' }, children: (() => {
            const totaisCombinados = calcularTotaisCombinados();
            return (_jsxs(_Fragment, { children: [
                _jsx(ResumoCard, { titulo: "Saldo anterior", valor: `${totaisCombinados.totalSaldoAnterior}` }),
                _jsx(ResumoCard, { titulo: "Recebido (unid)", valor: `${totaisCombinados.totalRecebido}` }),
                _jsx(ResumoCard, { titulo: "Vendas do dia", destaque: true, valor: `${totaisCombinados.vendasDia}` }),
                _jsx(ResumoCard, { titulo: "Freezer", valor: `${totaisCombinados.totalFreezer}` }),
                _jsx(ResumoCard, { titulo: "Estufa", valor: `${totaisCombinados.totalEstufa}` }),
                _jsx(ResumoCard, { titulo: "Perdas", valor: `${totaisCombinados.totalPerdas}` }),
                _jsx(ResumoCard, { titulo: "Total Empadas", valor: `${totaisCombinados.totalEmpadas}` }),
                _jsx(ResumoCard, { titulo: "Pedido (caixas)", valor: `${totaisCombinados.totalPedido}` }),
                _jsx(ResumoCard, { titulo: "Valor do Pedido", valor: `R$ ${totaisCombinados.valorTotalPedido.toFixed(2)}`, destaque: true }),
                _jsx(ResumoCard, { titulo: "Caixas Totais", valor: `${totaisCombinados.totalEmpadasCaixas}` }),
                _jsx(ResumoCard, { titulo: "Valor Estimado Vendas", valor: `R$ ${(totaisCombinados.vendasDia * 7.00).toFixed(2)}`, destaque: true })
            ] }));
        })() }),
        _jsxs("div", { style: { marginBottom: '30px' }, children: [
            _jsx("h2", { style: { color: '#3498db', marginBottom: '10px' }, children: "🥧 EMPADAS" }),
            _jsx(TabelaControle, { 
                tipoProduto: "empada", 
                sabores: SABORES_EMPADA, 
                linhas: linhas.filter((_, index) => index < SABORES_EMPADA.length), 
                pedidoCaixas: pedidoCaixas.slice(0, SABORES_EMPADA.length), 
                recebidoHoje: recebidoHoje.slice(0, SABORES_EMPADA.length), 
                saldoAnteriorPorSabor: saldoAnteriorPorSabor, 
                mostrarPedido: mostrarPedido, 
                alterarLinha: alterarLinha, 
                alterarPedido: alterarPedido, 
                alterarRecebido: alterarRecebido, 
                totais: calcularTotaisPorTipo('empada') 
            })
        ] }),
        _jsxs("div", { style: { marginBottom: '30px' }, children: [
            _jsx("h2", { style: { color: '#e74c3c', marginBottom: '10px' }, children: "🥟 EMPADÕES" }),
            _jsx(TabelaControle, { 
                tipoProduto: "empadao", 
                sabores: SABORES_EMPADAO, 
                linhas: linhas.slice(SABORES_EMPADA.length), 
                pedidoCaixas: pedidoCaixas.slice(SABORES_EMPADA.length), 
                recebidoHoje: recebidoHoje.slice(SABORES_EMPADA.length), 
                saldoAnteriorPorSabor: saldoAnteriorPorSabor, 
                mostrarPedido: mostrarPedido, 
                alterarLinha: (index, campo, valor) => alterarLinha(index + SABORES_EMPADA.length, campo, valor), 
                alterarPedido: (index, valor) => alterarPedido(index + SABORES_EMPADA.length, valor), 
                alterarRecebido: (index, valor) => alterarRecebido(index + SABORES_EMPADA.length, valor), 
                totais: calcularTotaisPorTipo('empadao') 
            })
        ] }),
        _jsx("div", { style: { display: 'flex', gap: 8, marginTop: 12 }, children: _jsx("button", { className: "salvar-btn", onClick: salvar, children: "Salvar Contagem" }) })
    ] }));
};

const ResumoCard = ({ titulo, valor, destaque, alerta, ajuda }) => {
    return (_jsxs("div", { style: {
        padding: 10,
        border: '1px solid #444',
        borderRadius: 8,
        background: alerta ? '#3a1f1f' : destaque ? '#1f2a3a' : '#202020',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
    }, children: [
        _jsx("span", { style: { opacity: 0.8 }, children: titulo }),
        _jsx("strong", { style: { fontSize: 18 }, children: valor }),
        ajuda && _jsx("span", { style: { opacity: 0.8, fontSize: 12 }, children: ajuda })
    ] }));
};

export default ControleDiario;