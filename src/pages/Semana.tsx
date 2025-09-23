// src/pages/Semana.tsx
import React, { useState, useEffect } from 'react';
import { buscarDadosSemana, calcularTotais, buscarSaldoInicialPorSabor, buscarSaldoFinalPorSabor } from '../services/firebaseService';
import { Contagem } from '../types/Contagem';

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

	const carregarSemana = async () => {
		if (!semanaSelecionada) return;
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

	return (
		<div className="container">
			<h1>
				Semanas de {mes.toString().padStart(2, '0')}/{ano} — {semanaSelecionada?.label}
			</h1>

			<div className="controls" style={{ gap: 8, display: 'flex', alignItems: 'center' }}>
				<button onClick={() => setAno((a) => a - 1)}>Ano -</button>
				<span>{ano}</span>
				<button onClick={() => setAno((a) => a + 1)}>Ano +</button>
				<button onClick={() => setMes((m) => (m > 1 ? m - 1 : 12))}>Mês -</button>
				<span>{mes.toString().padStart(2, '0')}</span>
				<button onClick={() => setMes((m) => (m < 12 ? m + 1 : 1))}>Mês +</button>
				<button onClick={anterior} disabled={semanaIndex === 0}>
					Semana Anterior
				</button>
				<button onClick={proxima} disabled={semanas.length === 0 || semanaIndex === semanas.length - 1}>
					Próxima Semana
				</button>
			</div>

			<table className="tabela-resumo">
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
								<td>{variacaoPorSabor(item.sabor)}</td>
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
	);
};

export default Semana;
