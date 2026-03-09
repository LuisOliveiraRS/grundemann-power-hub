import gasCabecote from "@/assets/exploded/gas-01-cabecote.jpg";
import gasPistao from "@/assets/exploded/gas-02-pistao.png";
import gasBloco from "@/assets/exploded/gas-03-bloco.jpg";
import gasVolante from "@/assets/exploded/gas-04-volante.jpg";
import gasCarburador from "@/assets/exploded/gas-05-carburador.jpg";
import gasRetratil from "@/assets/exploded/gas-07-retratil.png";
import gasFiltro from "@/assets/exploded/gas-08-filtro.png";
import gasEscape from "@/assets/exploded/gas-09-escape.jpg";
import gasTampa from "@/assets/exploded/gas-10-tampa.png";
import gasAcelerador from "@/assets/exploded/gas-11-acelerador.jpg";
import gasTanque from "@/assets/exploded/gas-12-tanque.jpg";
import gasCarenagem from "@/assets/exploded/gas-13-carenagem.jpg";

export interface PartOverlay {
  name: string;
  code: string;
  x: number; // % from left
  y: number; // % from top
}

export interface CatalogSection {
  id: string;
  label: string;
  name: string;
  description: string;
  searchTerm: string;
  image: string;
  parts?: PartOverlay[];
}

export const gasolineSections: CatalogSection[] = [
  { id: "cabecote", label: "01", name: "Cabeçote", description: "Tampa, válvulas, varetas, balancins, eixo de comando e componentes do cabeçote", searchTerm: "cabeçote", image: gasCabecote, parts: [
    { name: "Tampa do Cabeçote", code: "KF-G01-01", x: 30, y: 15 },
    { name: "Válvula de Admissão", code: "KF-G01-02", x: 55, y: 35 },
    { name: "Mola da Válvula", code: "KF-G01-03", x: 70, y: 25 },
    { name: "Vareta", code: "KF-G01-04", x: 40, y: 55 },
    { name: "Balancim", code: "KF-G01-05", x: 25, y: 45 },
    { name: "Junta do Cabeçote", code: "KF-G01-06", x: 60, y: 75 },
  ]},
  { id: "pistao-biela", label: "02", name: "Pistão / Biela", description: "Pistão, pino, anéis, biela e bronzinas", searchTerm: "pistão", image: gasPistao, parts: [
    { name: "Pistão", code: "KF-G02-01", x: 35, y: 20 },
    { name: "Anéis do Pistão", code: "KF-G02-02", x: 60, y: 30 },
    { name: "Pino do Pistão", code: "KF-G02-03", x: 45, y: 45 },
    { name: "Biela", code: "KF-G02-04", x: 40, y: 65 },
    { name: "Bronzina", code: "KF-G02-05", x: 65, y: 75 },
  ]},
  { id: "bloco", label: "03", name: "Bloco do Motor", description: "Bloco, retentores, bujões, interruptores de nível de óleo e chapas defletoras", searchTerm: "bloco", image: gasBloco, parts: [
    { name: "Bloco do Motor", code: "KF-G03-01", x: 45, y: 40 },
    { name: "Retentor", code: "KF-G03-02", x: 25, y: 25 },
    { name: "Bujão de Óleo", code: "KF-G03-03", x: 70, y: 70 },
    { name: "Chapa Defletora", code: "KF-G03-04", x: 55, y: 60 },
  ]},
  { id: "volante-virabrequim", label: "04", name: "Volante / Virabrequim", description: "Eixo virabrequim, volante magnético, rolamentos, chavetas e ventoinhas", searchTerm: "virabrequim", image: gasVolante, parts: [
    { name: "Virabrequim", code: "KF-G04-01", x: 40, y: 50 },
    { name: "Volante Magnético", code: "KF-G04-02", x: 25, y: 20 },
    { name: "Chaveta", code: "KF-G04-03", x: 60, y: 35 },
    { name: "Rolamento", code: "KF-G04-04", x: 70, y: 65 },
    { name: "Ventoinha", code: "KF-G04-05", x: 35, y: 75 },
  ]},
  { id: "carburador", label: "05", name: "Carburador", description: "Carburador completo, cuba, bóia, gicleurs, juntas e coletor de admissão", searchTerm: "carburador", image: gasCarburador, parts: [
    { name: "Carburador Completo", code: "KF-G05-01", x: 40, y: 30 },
    { name: "Cuba", code: "KF-G05-02", x: 55, y: 50 },
    { name: "Bóia", code: "KF-G05-03", x: 30, y: 55 },
    { name: "Gicleur", code: "KF-G05-04", x: 65, y: 40 },
    { name: "Junta do Carburador", code: "KF-G05-05", x: 45, y: 70 },
    { name: "Coletor de Admissão", code: "KF-G05-06", x: 25, y: 80 },
  ]},
  { id: "retratil", label: "07", name: "Retrátil (Partida)", description: "Partida retrátil completa, carcaça, mola, corda, punho e cachorrete", searchTerm: "retrátil", image: gasRetratil, parts: [
    { name: "Retrátil Completo", code: "KF-G07-01", x: 40, y: 25 },
    { name: "Mola de Retorno", code: "KF-G07-02", x: 55, y: 45 },
    { name: "Corda", code: "KF-G07-03", x: 30, y: 60 },
    { name: "Punho", code: "KF-G07-04", x: 70, y: 35 },
    { name: "Cachorrete", code: "KF-G07-05", x: 45, y: 70 },
  ]},
  { id: "filtro-ar", label: "08", name: "Filtro de Ar", description: "Conjunto filtro de ar, elemento filtrante, suporte e corpo do filtro", searchTerm: "filtro de ar", image: gasFiltro, parts: [
    { name: "Elemento Filtrante", code: "KF-G08-01", x: 40, y: 30 },
    { name: "Corpo do Filtro", code: "KF-G08-02", x: 55, y: 55 },
    { name: "Tampa do Filtro", code: "KF-G08-03", x: 35, y: 15 },
    { name: "Suporte", code: "KF-G08-04", x: 60, y: 75 },
  ]},
  { id: "escape", label: "09", name: "Escape", description: "Escape completo, coletor de escape, junta e direcionador de fumaça", searchTerm: "escapamento", image: gasEscape, parts: [
    { name: "Escape Completo", code: "KF-G09-01", x: 40, y: 35 },
    { name: "Coletor de Escape", code: "KF-G09-02", x: 60, y: 55 },
    { name: "Junta do Escape", code: "KF-G09-03", x: 30, y: 65 },
  ]},
  { id: "tampa-lateral", label: "10", name: "Tampa Lateral", description: "Tampa carcaça, junta, retentores, rolamentos e jogo de juntas", searchTerm: "tampa", image: gasTampa, parts: [
    { name: "Tampa Carcaça", code: "KF-G10-01", x: 40, y: 30 },
    { name: "Junta da Tampa", code: "KF-G10-02", x: 55, y: 50 },
    { name: "Retentor", code: "KF-G10-03", x: 30, y: 65 },
    { name: "Rolamento", code: "KF-G10-04", x: 65, y: 70 },
  ]},
  { id: "acelerador-rar", label: "11", name: "Acelerador / RAR", description: "Conjunto RAR, braço, molas de retorno, alavanca e haste de ligação", searchTerm: "acelerador", image: gasAcelerador, parts: [
    { name: "Conjunto RAR", code: "KF-G11-01", x: 35, y: 30 },
    { name: "Braço do RAR", code: "KF-G11-02", x: 55, y: 45 },
    { name: "Mola de Retorno", code: "KF-G11-03", x: 40, y: 65 },
    { name: "Alavanca", code: "KF-G11-04", x: 65, y: 55 },
  ]},
  { id: "tanque", label: "12", name: "Tanque", description: "Tanque de combustível, tampa, peneira, mangueira e torneira", searchTerm: "tanque", image: gasTanque, parts: [
    { name: "Tanque", code: "KF-G12-01", x: 40, y: 30 },
    { name: "Tampa do Tanque", code: "KF-G12-02", x: 30, y: 15 },
    { name: "Torneira", code: "KF-G12-03", x: 60, y: 65 },
    { name: "Peneira", code: "KF-G12-04", x: 50, y: 50 },
    { name: "Mangueira", code: "KF-G12-05", x: 70, y: 75 },
  ]},
  { id: "carenagem-partida", label: "13", name: "Carenagem / Partida Elétrica", description: "Carenagem, bobina de ignição/luz, motor de partida, painel e chave", searchTerm: "bobina", image: gasCarenagem, parts: [
    { name: "Carenagem", code: "KF-G13-01", x: 35, y: 25 },
    { name: "Bobina de Ignição", code: "KF-G13-02", x: 55, y: 40 },
    { name: "Motor de Partida", code: "KF-G13-03", x: 40, y: 60 },
    { name: "Chave de Ignição", code: "KF-G13-04", x: 65, y: 70 },
  ]},
];
