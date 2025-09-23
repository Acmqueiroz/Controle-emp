// src/services/firebaseService.ts
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Contagem } from '../types/Contagem'; // Importando o tipo Contagem

// Função para buscar os dados da semana com base nas datas de início e fim
export const buscarDadosSemana = async (dataInicio: Date, dataFim: Date): Promise<Contagem[]> => {
  const empadasCollection = collection(db, 'contagem_diaria');

  // Query que filtra os documentos entre dataInicio e dataFim
  const q = query(
    empadasCollection,
    where('data', '>=', dataInicio.toISOString().split('T')[0]),
    where('data', '<=', dataFim.toISOString().split('T')[0])
  );

  try {
    const querySnapshot = await getDocs(q);
    // Definindo um tipo forte para os dados
    const dados: Contagem[] = querySnapshot.docs.map((doc) => doc.data() as Contagem);
    return dados;
  } catch (e) {
    console.error('Erro ao buscar dados da semana:', e);
    return [];
  }
};

// Função para calcular os totais de freezer, estufa e perdas
export const calcularTotais = (dados: Contagem[]): { totalFreezer: number, totalEstufa: number, totalPerdas: number, totalEmpadas: number } => {
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
