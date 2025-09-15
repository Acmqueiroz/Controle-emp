import { collection, addDoc, getDocs } from "firebase/firestore";
import { Empada } from "../types/Empada";
import { db } from "../firebase"; // ou onde estiver seu arquivo de configuração


const empadasCollection = collection(db, "empadas");

export const addEmpada = async (empadaData: Empada) => {
  try {
    const docRef = await addDoc(empadasCollection, empadaData);
    console.log("Empada adicionada com ID: ", docRef.id);
  } catch (e) {
    console.error("Erro ao adicionar empada: ", e);
  }
};

export const getEmpadas = async (): Promise<(Empada & { id: string })[]> => {
  try {
    const querySnapshot = await getDocs(empadasCollection);
    const empadasList: (Empada & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      empadasList.push({ id: doc.id, ...(doc.data() as Empada) });
    });
    return empadasList;
  } catch (e) {
    console.error("Erro ao buscar empadas: ", e);
    return [];
  }
};
