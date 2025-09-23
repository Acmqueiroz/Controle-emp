// src/pages/Mes.tsx
import React, { useEffect, useState } from 'react';
import { buscarDadosDoMes, calcularResumoMensal, ResumoDiario } from '../services/firebaseService';

const Mes: React.FC = () => {
	const hoje = new Date();
	const [ano, setAno] = useState(hoje.getFullYear());
	const [mes, setMes] = useState(hoje.getMonth() + 1);
	const [dias, setDias] = useState<ResumoDiario[]>([]);
	const [totais, setTotais] = useState({ perdasTotais: 0, pedidosCaixas: 0, vendasEstimadas: 0 });

	const carregar = async () => {
		const { contagens, dias } = await buscarDadosDoMes(ano, mes);
		setDias(dias);
		setTotais(calcularResumoMensal(contagens));
	};

	useEffect(() => {
		carregar();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ano, mes]);

	return (
		<div className="container">
			<h1>Resumo Mensal — {mes.toString().padStart(2, '0')}/{ano}</h1>
			<div className="controls" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
				<button onClick={() => setAno((a) => a - 1)}>Ano -</button>
				<span>{ano}</span>
				<button onClick={() => setAno((a) => a + 1)}>Ano +</button>
				<button onClick={() => setMes((m) => (m > 1 ? m - 1 : 12))}>Mês -</button>
				<span>{mes.toString().padStart(2, '0')}</span>
				<button onClick={() => setMes((m) => (m < 12 ? m + 1 : 1))}>Mês +</button>
			</div>

			<table className="tabela-resumo" style={{ marginTop: 12 }}>
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
	);
};

export default Mes;
