// src/services/firebaseService.ts
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Contagem } from '../types/Contagem';

// Estrutura esperada do documento salvo em contagem_diaria
// { data: 'YYYY-MM-DD', itens: [{ sabor, freezer, estufa, perdas, saldoInformado? }], pedidoCaixas?: number[] }

type FirestoreContagemItem = {
	sabor: string;
	freezer: number | '';
	estufa: number | '';
	perdas: number | '';
	saldoInformado?: number | '';
};

type FirestoreContagemDoc = {
	data: string;
	itens: FirestoreContagemItem[];
	pedidoCaixas?: number[];
};

// Função para buscar os dados da semana com base nas datas de início e fim
export const buscarDadosSemana = async (dataInicio: Date, dataFim: Date): Promise<Contagem[]> => {
	const empadasCollection = collection(db, 'contagem_diaria');

	// Query que filtra os documentos entre dataInicio e dataFim (datas são salvas como string YYYY-MM-DD)
	const q = query(
		empadasCollection,
		where('data', '>=', dataInicio.toISOString().split('T')[0]),
		where('data', '<=', dataFim.toISOString().split('T')[0])
	);

	try {
		const querySnapshot = await getDocs(q);

		// Agrega por sabor somando freezer/estufa/perdas através dos documentos
		const agregadoPorSabor = new Map<string, Contagem>();

		querySnapshot.forEach((docSnap) => {
			const dados = docSnap.data() as FirestoreContagemDoc;
			if (!dados || !Array.isArray(dados.itens)) return;

			dados.itens.forEach((item) => {
				const sabor = item.sabor;
				const freezer = Number(item.freezer) || 0;
				const estufa = Number(item.estufa) || 0;
				const perdas = Number(item.perdas) || 0;

				const existente = agregadoPorSabor.get(sabor) || { sabor, freezer: 0, estufa: 0, perdas: 0 };
				existente.freezer += freezer;
				existente.estufa += estufa;
				existente.perdas += perdas;
				agregadoPorSabor.set(sabor, existente);
			});
		});

		return Array.from(agregadoPorSabor.values());
	} catch (e) {
		console.error('Erro ao buscar dados da semana:', e);
		return [];
	}
};

// Busca o último saldoInformado antes de uma data (saldo inicial)
export const buscarSaldoInicialPorSabor = async (
	dataReferencia: Date
): Promise<Record<string, number>> => {
	const empadasCollection = collection(db, 'contagem_diaria');
	const dataStr = dataReferencia.toISOString().split('T')[0];
	const q = query(
		empadasCollection,
		where('data', '<', dataStr),
		orderBy('data', 'desc'),
		limit(7) // última semana aprox
	);

	const saldos: Record<string, number> = {};
	const snap = await getDocs(q);
	snap.forEach((docSnap) => {
		const dados = docSnap.data() as FirestoreContagemDoc;
		if (!dados?.itens) return;
		dados.itens.forEach((i, index) => {
			// Calcular saldo baseado no saldo previsto (total + pedidos)
			const freezer = Number(i.freezer) || 0;
			const estufa = Number(i.estufa) || 0;
			const perdas = Number(i.perdas) || 0;
			const total = freezer + estufa - perdas;
			const pedidoCaixas = dados.pedidoCaixas?.[index] || 0;
			const saldoPrevisto = total + (pedidoCaixas * 18); // 18 itens por caixa
			saldos[i.sabor] = saldoPrevisto;
		});
	});
	return saldos;
};

// Busca o último saldoInformado dentro do intervalo (saldo final da semana)
export const buscarSaldoFinalPorSabor = async (
	dataInicio: Date,
	dataFim: Date
): Promise<Record<string, number>> => {
	const empadasCollection = collection(db, 'contagem_diaria');
	const q = query(
		empadasCollection,
		where('data', '>=', dataInicio.toISOString().split('T')[0]),
		where('data', '<=', dataFim.toISOString().split('T')[0]),
		orderBy('data', 'desc')
	);
	const saldos: Record<string, number> = {};
	const snap = await getDocs(q);
	snap.forEach((docSnap) => {
		const dados = docSnap.data() as FirestoreContagemDoc;
		if (!dados?.itens) return;
		dados.itens.forEach((i, index) => {
			// Calcular saldo baseado no saldo previsto (total + pedidos)
			const freezer = Number(i.freezer) || 0;
			const estufa = Number(i.estufa) || 0;
			const perdas = Number(i.perdas) || 0;
			const total = freezer + estufa - perdas;
			const pedidoCaixas = dados.pedidoCaixas?.[index] || 0;
			const saldoPrevisto = total + (pedidoCaixas * 18); // 18 itens por caixa
			saldos[i.sabor] = saldoPrevisto;
		});
	});
	return saldos;
};

// Função para calcular os totais de freezer, estufa e perdas
export const calcularTotais = (
	dados: Contagem[]
): { totalFreezer: number; totalEstufa: number; totalPerdas: number; totalEmpadas: number } => {
	let totalFreezer = 0;
	let totalEstufa = 0;
	let totalPerdas = 0;

	dados.forEach((item) => {
		totalFreezer += item.freezer || 0;
		totalEstufa += item.estufa || 0;
		totalPerdas += item.perdas || 0;
	});

	const totalEmpadas = totalFreezer + totalEstufa - totalPerdas;

	return {
		totalFreezer,
		totalEstufa,
		totalPerdas,
		totalEmpadas,
	};
};

export type ResumoDiario = {
	data: string;
	resumo?: {
		totalFreezer: number;
		totalEstufa: number;
		totalPerdas: number;
		totalEmpadas: number;
		totalSaldoInformado: number;
		totalDiferenca: number;
		totalPedidoCaixas: number;
		capacidadeFreezerCaixas: number;
		capacidadeOcupadaCaixas: number;
		capacidadeRestanteCaixas: number;
	};
};

export const buscarDadosDoMes = async (
	ano: number,
	mes: number
): Promise<{ contagens: FirestoreContagemDoc[]; dias: ResumoDiario[] }> => {
	const empadasCollection = collection(db, 'contagem_diaria');
	const inicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0];
	const fim = new Date(ano, mes, 0).toISOString().split('T')[0];
	const q = query(
		empadasCollection,
		where('data', '>=', inicio),
		where('data', '<=', fim),
		orderBy('data', 'asc')
	);
	const snap = await getDocs(q);
	const contagens: FirestoreContagemDoc[] = [];
	const dias: ResumoDiario[] = [];
	snap.forEach((d) => {
		const dados = d.data() as FirestoreContagemDoc & { resumo?: ResumoDiario['resumo'] };
		contagens.push(dados);
		dias.push({ data: dados.data, resumo: dados.resumo });
	});
	return { contagens, dias };
};

export const calcularResumoMensal = (contagens: FirestoreContagemDoc[]) => {
	// Agregar por sabor e somar perdas/pedidos e variação via saldoInformado
	const perdasTotais = contagens.reduce((acc, c) => acc + c.itens.reduce((t, i) => t + (Number(i.perdas) || 0), 0), 0);
	const pedidosCaixas = contagens.reduce((acc, c) => acc + (c.pedidoCaixas?.reduce((t, v) => t + (v || 0), 0) || 0), 0);

	// Vendas estimadas: soma das diferenças diárias positivas (saldoInformado - totalCalculado)
	let vendasEstimadas = 0;
	contagens.forEach((c) => {
		c.itens.forEach((i) => {
			const freezer = Number(i.freezer) || 0;
			const estufa = Number(i.estufa) || 0;
			const perdas = Number(i.perdas) || 0;
			const totalCalc = freezer + estufa - perdas;
			const saldoInf = Number(i.saldoInformado ?? 0) || 0;
			const diff = saldoInf - totalCalc;
			if (diff > 0) vendasEstimadas += diff;
		});
	});

	return {
		perdasTotais,
		pedidosCaixas,
		vendasEstimadas,
	};
};

export const buscarDocumentoAnterior = async (dataStr: string): Promise<FirestoreContagemDoc | null> => {
	const empadasCollection = collection(db, 'contagem_diaria');
	const q = query(empadasCollection, where('data', '<', dataStr), orderBy('data', 'desc'), limit(1));
	const snap = await getDocs(q);
	if (snap.empty) return null;
	return snap.docs[0].data() as FirestoreContagemDoc;
};
