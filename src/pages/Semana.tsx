import React, { useState, useEffect } from 'react';
import { buscarDadosSemana, calcularTotais, buscarSaldoInicialPorSabor, buscarSaldoFinalPorSabor } from '../services/firebaseService';
import { Contagem } from '../types/Contagem';
import { RelatorioSemanal, Venda, Pedido } from '../types/Precos';
import './Semana.css';

const Semana: React.FC = () => {
	const [dadosSemana, setDadosSemana] = useState<Contagem[]>([]);
	const [totais, setTotais] = useState({
		totalFreezer: 0,
		totalEstufa: 0,
		totalPerdas: 0,
		totalEmpadas: 0,
	});
	const [saldoInicial, setSaldoInicial] = useState<Record<string, number>>({});
	const [saldoFinal, setSaldoFinal] = useState<Record<string, number>>({});
	const [relatorioSemanal, setRelatorioSemanal] = useState<RelatorioSemanal | null>(null);
	const [mostrarComparacao, setMostrarComparacao] = useState(false);

	const [ano, setAno] = useState(new Date().getFullYear());
	const [mes, setMes] = useState(new Date().getMonth() + 1);
	const [semanaIndex, setSemanaIndex] = useState(0);

	const gerarSemanasDoMes = (ano: number, mes: number): { inicio: Date; fim: Date; label: string }[] => {
		const primeiroDia = new Date(ano, mes - 1, 1);
		const ultimoDia = new Date(ano, mes, 0);
		const semanas: { inicio: Date; fim: Date; label: string }[] = [];
		let inicio = new Date(primeiroDia);
		while (inicio <= ultimoDia) {
			const fim = new Date(inicio);
			fim.setDate(fim.getDate() + 6);
			if (fim > ultimoDia) fim.setTime(ultimoDia.getTime());
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

	// Gerar dados de exemplo para demonstração
	const gerarDadosExemplo = (inicio: Date, fim: Date) => {
		const vendasExemplo: Venda[] = [];
		const pedidosExemplo: Pedido[] = [];
		
		// Gerar vendas para a semana
		for (let i = 0; i < 7; i++) {
			const data = new Date(inicio);
			data.setDate(data.getDate() + i);
			
			const quantidadeVendas = Math.floor(Math.random() * 5) + 1;
			for (let j = 0; j < quantidadeVendas; j++) {
				const sabores = ['FRANGO', 'CAMARÃO', 'QUEIJO', 'CARNE SECA', 'PALMITO'];
				const sabor = sabores[Math.floor(Math.random() * sabores.length)];
				const tipo = Math.random() > 0.7 ? 'EMPADÃO' : 'EMPADA';
				const quantidade = Math.floor(Math.random() * 30) + 1;
				const precoUnidade = tipo === 'EMPADÃO' ? 
					(sabor === 'CAMARÃO' ? 7.07 : sabor === 'CARNE SECA' ? 6.97 : 5.00) :
					(sabor === 'QUEIJO' ? 4.02 : sabor === 'CAMARÃO' ? 3.14 : 2.59);
				
				vendasExemplo.push({
					id: `${i}-${j}`,
					data,
					sabor,
					tipo,
					quantidade,
					precoUnidade,
					precoTotal: quantidade * precoUnidade,
					formaPagamento: ['dinheiro', 'cartao', 'pix'][Math.floor(Math.random() * 3)] as any
				});
			}
		}

		// Gerar pedidos para a semana
		for (let i = 0; i < 3; i++) {
			const data = new Date(inicio);
			data.setDate(data.getDate() + (i * 2));
			
			const sabores = ['FRANGO', 'CAMARÃO', 'QUEIJO', 'CARNE SECA'];
			const sabor = sabores[Math.floor(Math.random() * sabores.length)];
			const tipo = Math.random() > 0.5 ? 'EMPADÃO' : 'EMPADA';
			const quantidade = Math.floor(Math.random() * 50) + 25;
			const precoUnidade = tipo === 'EMPADÃO' ? 
				(sabor === 'CAMARÃO' ? 4.00 : sabor === 'CARNE SECA' ? 3.50 : 2.50) :
				(sabor === 'QUEIJO' ? 2.00 : sabor === 'CAMARÃO' ? 2.50 : 1.50);
			
			pedidosExemplo.push({
				id: `pedido-${i}`,
				data,
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

	const calcularRelatorioSemanal = () => {
		if (!semanaSelecionada) return;
		
		const { vendasExemplo, pedidosExemplo } = gerarDadosExemplo(semanaSelecionada.inicio, semanaSelecionada.fim);
		
		const totalVendas = vendasExemplo.reduce((acc, v) => acc + v.precoTotal, 0);
		const totalPedidos = pedidosExemplo.reduce((acc, p) => acc + p.precoTotal, 0);
		const lucroBruto = totalVendas - totalPedidos;

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

		// Comparação com semana anterior (simulada)
		const comparacaoSemanaAnterior = {
			vendas: totalVendas * (0.8 + Math.random() * 0.4), // Variação de 80% a 120%
			pedidos: totalPedidos * (0.8 + Math.random() * 0.4),
			lucro: lucroBruto * (0.8 + Math.random() * 0.4)
		};

		const relatorio: RelatorioSemanal = {
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
		if (!semanaSelecionada) return;
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
		} catch (error) {
			console.log('Usando dados de exemplo');
		}
		calcularRelatorioSemanal();
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
	const variacaoPorSabor = (sabor: string) => {
		const ini = saldoInicial[sabor] ?? 0;
		const fim = saldoFinal[sabor] ?? 0;
		return fim - ini;
	};

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

	const calcularVariacao = (atual: number, anterior: number) => {
		if (anterior === 0) return 0;
		return ((atual - anterior) / anterior) * 100;
	};

	return (
		<div className="semana-container">
			<div className="semana-header">
				<h1>
					Relatório Semanal — {getNomeMes(mes)} {ano}
				</h1>
				<div className="semana-actions">
					<button 
						className="btn-comparacao"
						onClick={() => setMostrarComparacao(!mostrarComparacao)}
					>
						{mostrarComparacao ? 'Ocultar' : 'Mostrar'} Comparação
					</button>
					<button className="btn-exportar">Exportar</button>
				</div>
			</div>

			<div className="semana-info">
				<h2>Semana {semanaIndex + 1} — {semanaSelecionada?.label}</h2>
			</div>

			<div className="semana-controls">
				<button onClick={() => setAno((a) => a - 1)}>← Ano</button>
				<span className="ano-atual">{ano}</span>
				<button onClick={() => setAno((a) => a + 1)}>Ano →</button>
				<button onClick={() => setMes((m) => (m > 1 ? m - 1 : 12))}>← Mês</button>
				<span className="mes-atual">{getNomeMes(mes)}</span>
				<button onClick={() => setMes((m) => (m < 12 ? m + 1 : 1))}>Mês →</button>
				<button onClick={anterior} disabled={semanaIndex === 0}>
					← Semana Anterior
				</button>
				<button onClick={proxima} disabled={semanas.length === 0 || semanaIndex === semanas.length - 1}>
					Próxima Semana →
				</button>
			</div>

			{relatorioSemanal && (
				<div className="resumo-semanal">
					<h3>Resumo da Semana</h3>
					<div className="cards-semanais">
						<div className="card-semanal vendas">
							<h4>Total de Vendas</h4>
							<p className="valor">{formatarMoeda(relatorioSemanal.totalVendas)}</p>
							<small>Receita da semana</small>
						</div>
						<div className="card-semanal pedidos">
							<h4>Total de Pedidos</h4>
							<p className="valor">{formatarMoeda(relatorioSemanal.totalPedidos)}</p>
							<small>Custos da semana</small>
						</div>
						<div className="card-semanal lucro">
							<h4>Lucro Bruto</h4>
							<p className="valor">{formatarMoeda(relatorioSemanal.lucroBruto)}</p>
							<small>Vendas - Pedidos</small>
						</div>
					</div>
				</div>
			)}

			{mostrarComparacao && relatorioSemanal && (
				<div className="comparacao-semanal">
					<h3>Comparação com Semana Anterior</h3>
					<div className="cards-comparacao">
						<div className="card-comparacao">
							<h4>Vendas</h4>
							<div className="valores-comparacao">
								<span className="atual">{formatarMoeda(relatorioSemanal.totalVendas)}</span>
								<span className="anterior">{formatarMoeda(relatorioSemanal.comparacaoSemanaAnterior.vendas)}</span>
								<span className={`variacao ${relatorioSemanal.totalVendas >= relatorioSemanal.comparacaoSemanaAnterior.vendas ? 'positiva' : 'negativa'}`}>
									{calcularVariacao(relatorioSemanal.totalVendas, relatorioSemanal.comparacaoSemanaAnterior.vendas).toFixed(1)}%
								</span>
							</div>
						</div>
						<div className="card-comparacao">
							<h4>Pedidos</h4>
							<div className="valores-comparacao">
								<span className="atual">{formatarMoeda(relatorioSemanal.totalPedidos)}</span>
								<span className="anterior">{formatarMoeda(relatorioSemanal.comparacaoSemanaAnterior.pedidos)}</span>
								<span className={`variacao ${relatorioSemanal.totalPedidos <= relatorioSemanal.comparacaoSemanaAnterior.pedidos ? 'positiva' : 'negativa'}`}>
									{calcularVariacao(relatorioSemanal.totalPedidos, relatorioSemanal.comparacaoSemanaAnterior.pedidos).toFixed(1)}%
								</span>
							</div>
						</div>
						<div className="card-comparacao">
							<h4>Lucro</h4>
							<div className="valores-comparacao">
								<span className="atual">{formatarMoeda(relatorioSemanal.lucroBruto)}</span>
								<span className="anterior">{formatarMoeda(relatorioSemanal.comparacaoSemanaAnterior.lucro)}</span>
								<span className={`variacao ${relatorioSemanal.lucroBruto >= relatorioSemanal.comparacaoSemanaAnterior.lucro ? 'positiva' : 'negativa'}`}>
									{calcularVariacao(relatorioSemanal.lucroBruto, relatorioSemanal.comparacaoSemanaAnterior.lucro).toFixed(1)}%
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{relatorioSemanal && (
				<div className="sabores-top-semanal">
					<h3>Top 5 Sabores da Semana</h3>
					<div className="lista-sabores-semanal">
						{relatorioSemanal.saboresMaisVendidos.map((item, index) => (
							<div key={index} className="item-sabor-semanal">
								<div className="posicao-semanal">#{index + 1}</div>
								<div className="info-sabor-semanal">
									<h4>{item.sabor}</h4>
									<p>{item.quantidade} unidades</p>
									<p className="valor-sabor">{formatarMoeda(item.valor)}</p>
								</div>
								<div className="barra-progresso-semanal">
									<div 
										className="progresso-semanal"
										style={{ 
											width: `${(item.quantidade / relatorioSemanal.saboresMaisVendidos[0].quantidade) * 100}%` 
										}}
									></div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="tabela-detalhada-semanal">
				<h3>Controle Detalhado por Sabor</h3>
				<table className="tabela-resumo-semanal">
					<thead>
						<tr>
							<th>Sabor</th>
							<th>Freezer</th>
							<th>Estufa</th>
							<th>Perdas</th>
							<th>Total Empadas</th>
							<th>Saldo Inicial</th>
							<th>Saldo Final</th>
							<th>Variação</th>
						</tr>
					</thead>
					<tbody>
						{dadosSemana.length > 0 ? (
							dadosSemana.map((item, index) => (
								<tr key={index}>
									<td>{item.sabor}</td>
									<td>{item.freezer}</td>
									<td>{item.estufa}</td>
									<td>{item.perdas}</td>
									<td>{item.freezer + item.estufa - item.perdas}</td>
									<td>{saldoInicial[item.sabor] ?? 0}</td>
									<td>{saldoFinal[item.sabor] ?? 0}</td>
									<td className={variacaoPorSabor(item.sabor) >= 0 ? 'variacao-positiva' : 'variacao-negativa'}>
										{variacaoPorSabor(item.sabor)}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={8}>Nenhum dado disponível para essa semana.</td>
							</tr>
						)}
					</tbody>
					<tfoot>
						<tr>
							<td><strong>Total</strong></td>
							<td>{totais.totalFreezer}</td>
							<td>{totais.totalEstufa}</td>
							<td>{totais.totalPerdas}</td>
							<td>{totais.totalEmpadas}</td>
							<td colSpan={3}></td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	);
};

export default Semana;
