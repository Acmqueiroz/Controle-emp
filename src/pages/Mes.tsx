import React, { useEffect, useState } from 'react';
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

	// Dados de exemplo para demonstração
	const gerarDadosExemplo = () => {
		const vendasExemplo: Venda[] = [];
		const pedidosExemplo: Pedido[] = [];
		
		// Gerar vendas para o mês
		for (let dia = 1; dia <= 30; dia++) {
			const quantidadeVendas = Math.floor(Math.random() * 10) + 1;
			for (let i = 0; i < quantidadeVendas; i++) {
				const sabores = ['FRANGO', 'CAMARÃO', 'QUEIJO', 'CARNE SECA', 'PALMITO'];
				const sabor = sabores[Math.floor(Math.random() * sabores.length)];
				const tipo = Math.random() > 0.7 ? 'EMPADÃO' : 'EMPADA';
				const quantidade = Math.floor(Math.random() * 50) + 1;
				const precoUnidade = tipo === 'EMPADÃO' ? 
					(sabor === 'CAMARÃO' ? 7.07 : sabor === 'CARNE SECA' ? 6.97 : 5.00) :
					(sabor === 'QUEIJO' ? 4.02 : sabor === 'CAMARÃO' ? 3.14 : 2.59);
				
				vendasExemplo.push({
					id: `${dia}-${i}`,
					data: new Date(ano, mes - 1, dia),
					sabor,
					tipo,
					quantidade,
					precoUnidade,
					precoTotal: quantidade * precoUnidade,
					formaPagamento: ['dinheiro', 'cartao', 'pix'][Math.floor(Math.random() * 3)] as any
				});
			}
		}

		// Gerar pedidos para o mês
		for (let dia = 1; dia <= 15; dia += 2) {
			const sabores = ['FRANGO', 'CAMARÃO', 'QUEIJO', 'CARNE SECA'];
			const sabor = sabores[Math.floor(Math.random() * sabores.length)];
			const tipo = Math.random() > 0.5 ? 'EMPADÃO' : 'EMPADA';
			const quantidade = Math.floor(Math.random() * 100) + 50;
			const precoUnidade = tipo === 'EMPADÃO' ? 
				(sabor === 'CAMARÃO' ? 4.00 : sabor === 'CARNE SECA' ? 3.50 : 2.50) :
				(sabor === 'QUEIJO' ? 2.00 : sabor === 'CAMARÃO' ? 2.50 : 1.50);
			
			pedidosExemplo.push({
				id: `pedido-${dia}`,
				data: new Date(ano, mes - 1, dia),
				sabor,
				tipo,
				quantidade,
				precoUnidade,
				precoTotal: quantidade * precoUnidade,
				fornecedor: `Fornecedor ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
				status: 'entregue'
			});
		}

		return { vendasExemplo, pedidosExemplo };
	};

	const calcularRelatorioMensal = () => {
		const { vendasExemplo, pedidosExemplo } = gerarDadosExemplo();
		
		const totalVendas = vendasExemplo.reduce((acc, v) => acc + v.precoTotal, 0);
		const totalPedidos = pedidosExemplo.reduce((acc, p) => acc + p.precoTotal, 0);
		const lucroBruto = totalVendas - totalPedidos;
		const lucroLiquido = lucroBruto * 0.8; // Simulando despesas

		// Sabores mais vendidos
		const sabores: { [key: string]: { quantidade: number; valor: number } } = {};
		vendasExemplo.forEach(venda => {
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
			const vendasDia = vendasExemplo.filter(v => v.data.getDate() === dia);
			const pedidosDia = pedidosExemplo.filter(p => p.data.getDate() === dia);
			
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
		calcularRelatorioMensal();
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
