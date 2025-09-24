import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { buscarDadosDoMes, calcularResumoMensal, ResumoDiario } from '../services/firebaseService';
import { RelatorioMensal, Venda, Pedido } from '../types/Precos';
import './Mes.css';

const Mes: React.FC = () => {
	const hoje = new Date();
	const [ano, setAno] = useState(hoje.getFullYear());
	const [mes, setMes] = useState(hoje.getMonth() + 1);
	const [dias, setDias] = useState<ResumoDiario[]>([]);
	const [totais, setTotais] = useState({ perdasTotais: 0, pedidosCaixas: 0, vendasEstimadas: 0 });
	const [relatorioMensal, setRelatorioMensal] = useState<RelatorioMensal | null>(null);
	const [mostrarGraficos, setMostrarGraficos] = useState(false);

	// Carregar dados reais do mês
	const carregarDadosReais = async () => {
		try {
			// Buscar dados de contagem diária do mês
			const inicioMes = new Date(ano, mes - 1, 1);
			const fimMes = new Date(ano, mes, 0);
			
			const contagemQuery = query(
				collection(db, 'contagem_diaria'),
				where('data', '>=', inicioMes.toISOString().split('T')[0]),
				where('data', '<=', fimMes.toISOString().split('T')[0])
			);
			const contagemSnapshot = await getDocs(contagemQuery);
			
			// Buscar pedidos do mês
			const pedidosQuery = query(
				collection(db, 'pedidos'),
				where('data', '>=', inicioMes),
				where('data', '<=', fimMes)
			);
			const pedidosSnapshot = await getDocs(pedidosQuery);
			
			const vendasReais: Venda[] = [];
			const pedidosReais: Pedido[] = [];
			
			// Processar dados de contagem para gerar vendas
			contagemSnapshot.docs.forEach(doc => {
				const data = doc.data();
				if (data.itens && data.resumo && data.resumo.vendasDia > 0) {
					data.itens.forEach((item: any) => {
						if (item.sabor) {
							// Calcular vendas por sabor baseado na proporção
							const totalEmpadas = data.resumo.totalEmpadas || 1;
							const proporcaoVendas = (item.freezer + item.estufa - item.perdas) / totalEmpadas;
							const vendasSabor = Math.round(data.resumo.vendasDia * proporcaoVendas);
							
							if (vendasSabor > 0) {
								// Preços de venda
								const precosVenda: { [key: string]: { empada: number; empadao: number } } = {
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
								const precoUnidade = precosVenda[item.sabor]?.[tipoProduto as keyof typeof precosVenda[string]] || 2.59;
								
								vendasReais.push({
									id: `${doc.id}-${item.sabor}`,
									data: data.data ? new Date(data.data) : new Date(),
									sabor: item.sabor,
									tipo: tipoProduto.toUpperCase() as 'EMPADA' | 'EMPADÃO',
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
				} as Pedido);
			});
			
			return { vendasReais, pedidosReais };
		} catch (error) {
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
		const sabores: { [key: string]: { quantidade: number; valor: number } } = {};
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

		const relatorio: RelatorioMensal = {
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
		} catch (error) {
			console.log('Usando dados de exemplo');
			// Se não conseguir carregar do Firebase, usar dados de exemplo
		}
		await calcularRelatorioMensal();
	};

	useEffect(() => {
		carregar();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ano, mes]);

	const formatarMoeda = (valor: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(valor);
	};

	const getNomeMes = (mes: number) => {
		const meses = [
			'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
			'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
		];
		return meses[mes - 1];
	};

	return (
		<div className="mes-container">
			<div className="mes-header">
				<h1>Relatório Mensal — {getNomeMes(mes)} {ano}</h1>
				<div className="mes-actions">
					<button 
						className="btn-graficos"
						onClick={() => setMostrarGraficos(!mostrarGraficos)}
					>
						{mostrarGraficos ? 'Ocultar' : 'Mostrar'} Gráficos
					</button>
					<button className="btn-exportar">Exportar Relatório</button>
				</div>
			</div>

			<div className="mes-controls">
				<button onClick={() => setAno((a) => a - 1)}>← Ano</button>
				<span className="ano-atual">{ano}</span>
				<button onClick={() => setAno((a) => a + 1)}>Ano →</button>
				<button onClick={() => setMes((m) => (m > 1 ? m - 1 : 12))}>← Mês</button>
				<span className="mes-atual">{getNomeMes(mes)}</span>
				<button onClick={() => setMes((m) => (m < 12 ? m + 1 : 1))}>Mês →</button>
			</div>

			{relatorioMensal && (
				<div className="resumo-financeiro-mensal">
					<h2>Resumo Financeiro do Mês</h2>
					<div className="cards-mensais">
						<div className="card-mensal vendas">
							<h3>Total de Vendas</h3>
							<p className="valor">{formatarMoeda(relatorioMensal.totalVendas)}</p>
							<small>Receita bruta</small>
						</div>
						<div className="card-mensal pedidos">
							<h3>Total de Pedidos</h3>
							<p className="valor">{formatarMoeda(relatorioMensal.totalPedidos)}</p>
							<small>Custos de produção</small>
						</div>
						<div className="card-mensal lucro-bruto">
							<h3>Lucro Bruto</h3>
							<p className="valor">{formatarMoeda(relatorioMensal.lucroBruto)}</p>
							<small>Vendas - Pedidos</small>
						</div>
						<div className="card-mensal lucro-liquido">
							<h3>Lucro Líquido</h3>
							<p className="valor">{formatarMoeda(relatorioMensal.lucroLiquido)}</p>
							<small>Após despesas</small>
						</div>
					</div>
				</div>
			)}

			{relatorioMensal && (
				<div className="sabores-top-mensal">
					<h2>Top 5 Sabores Mais Vendidos</h2>
					<div className="lista-sabores-mensal">
						{relatorioMensal.saboresMaisVendidos.map((item, index) => (
							<div key={index} className="item-sabor-mensal">
								<div className="posicao-mensal">#{index + 1}</div>
								<div className="info-sabor-mensal">
									<h4>{item.sabor}</h4>
									<p>{item.quantidade} unidades vendidas</p>
									<p className="valor-sabor">{formatarMoeda(item.valor)}</p>
								</div>
								<div className="barra-progresso">
									<div 
										className="progresso"
										style={{ 
											width: `${(item.quantidade / relatorioMensal.saboresMaisVendidos[0].quantidade) * 100}%` 
										}}
									></div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{mostrarGraficos && relatorioMensal && (
				<div className="graficos-mensal">
					<h2>Gráfico de Vendas por Dia</h2>
					<div className="grafico-barras">
						{relatorioMensal.vendasPorDia.map((dia, index) => (
							<div key={index} className="barra-dia">
								<div 
									className="barra-vendas"
									style={{ 
										height: `${(dia.vendas / Math.max(...relatorioMensal.vendasPorDia.map(d => d.vendas))) * 200}px` 
									}}
								></div>
								<span className="label-dia">{dia.dia}</span>
								<span className="valor-dia">{formatarMoeda(dia.vendas)}</span>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="tabela-detalhada-mensal">
				<h2>Controle Diário Detalhado</h2>
				<table className="tabela-resumo-mensal">
					<thead>
						<tr>
							<th>Data</th>
							<th>Freezer</th>
							<th>Estufa</th>
							<th>Perdas</th>
							<th>Total Empadas</th>
							<th>Saldo Informado</th>
							<th>Diferença</th>
							<th>Pedido (caixas)</th>
						</tr>
					</thead>
					<tbody>
						{dias.length ? (
							dias.map((d) => (
								<tr key={d.data}>
									<td>{d.data}</td>
									<td>{d.resumo?.totalFreezer ?? '-'}</td>
									<td>{d.resumo?.totalEstufa ?? '-'}</td>
									<td>{d.resumo?.totalPerdas ?? '-'}</td>
									<td>{d.resumo?.totalEmpadas ?? '-'}</td>
									<td>{d.resumo?.totalSaldoInformado ?? '-'}</td>
									<td>{d.resumo?.totalDiferenca ?? '-'}</td>
									<td>{d.resumo?.totalPedidoCaixas ?? '-'}</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={8}>Sem dados no mês.</td>
							</tr>
						)}
					</tbody>
					<tfoot>
						<tr>
							<td><strong>Totais</strong></td>
							<td colSpan={2}></td>
							<td>{totais.perdasTotais}</td>
							<td></td>
							<td></td>
							<td>{totais.vendasEstimadas}</td>
							<td>{totais.pedidosCaixas}</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	);
};

export default Mes;
