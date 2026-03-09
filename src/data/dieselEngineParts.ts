import type { CatalogSection } from "./gasolineEngineParts";
import dieselCabecote from "@/assets/exploded/diesel-01-cabecote.jpg";
import dieselPistao from "@/assets/exploded/diesel-02-pistao.jpg";
import dieselBloco from "@/assets/exploded/diesel-03-bloco.jpg";
import dieselVolante from "@/assets/exploded/diesel-04-volante.jpg";
import dieselInjecao from "@/assets/exploded/diesel-06-injecao.png";
import dieselRetratil from "@/assets/exploded/diesel-07-retratil.jpg";
import dieselFiltro from "@/assets/exploded/diesel-08-filtro.jpg";
import dieselEscape from "@/assets/exploded/diesel-09-escape.jpg";
import dieselTampa from "@/assets/exploded/diesel-10-tampa.jpg";
import dieselAcelerador from "@/assets/exploded/diesel-11-acelerador.jpg";
import dieselTanque from "@/assets/exploded/diesel-12-tanque.jpg";
import dieselCarenagem from "@/assets/exploded/diesel-13-carenagem.jpg";

export const dieselSections: CatalogSection[] = [
  { id: "cabecote", label: "01", name: "Cabeçote", description: "Tampa, válvulas, varetas, balancins, eixo de comando, descompressor e bico injetor", searchTerm: "cabeçote", image: dieselCabecote, parts: [
    { name: "Tampa do Cabeçote", code: "KF-D01-01", x: 30, y: 15 },
    { name: "Válvula", code: "KF-D01-02", x: 55, y: 35 },
    { name: "Vareta", code: "KF-D01-03", x: 40, y: 55 },
    { name: "Balancim", code: "KF-D01-04", x: 25, y: 45 },
    { name: "Descompressor", code: "KF-D01-05", x: 70, y: 25 },
    { name: "Bico Injetor", code: "KF-D01-06", x: 60, y: 70 },
  ]},
  { id: "pistao-biela", label: "02", name: "Pistão / Biela", description: "Pistão, pino, anéis, biela e bronzinas", searchTerm: "pistão", image: dieselPistao, parts: [
    { name: "Pistão", code: "KF-D02-01", x: 35, y: 20 },
    { name: "Anéis", code: "KF-D02-02", x: 60, y: 30 },
    { name: "Pino", code: "KF-D02-03", x: 45, y: 45 },
    { name: "Biela", code: "KF-D02-04", x: 40, y: 65 },
    { name: "Bronzina", code: "KF-D02-05", x: 65, y: 75 },
  ]},
  { id: "bloco", label: "03", name: "Bloco do Motor", description: "Bloco, retentores, rolamentos, prisioneiros e chapas defletoras", searchTerm: "bloco", image: dieselBloco, parts: [
    { name: "Bloco", code: "KF-D03-01", x: 45, y: 40 },
    { name: "Retentor", code: "KF-D03-02", x: 25, y: 25 },
    { name: "Rolamento", code: "KF-D03-03", x: 70, y: 60 },
    { name: "Prisioneiro", code: "KF-D03-04", x: 55, y: 20 },
  ]},
  { id: "volante-virabrequim", label: "04", name: "Volante / Virabrequim", description: "Eixo virabrequim, volante, rolamentos, engrenagens e eixo balanceador", searchTerm: "virabrequim", image: dieselVolante, parts: [
    { name: "Virabrequim", code: "KF-D04-01", x: 40, y: 50 },
    { name: "Volante", code: "KF-D04-02", x: 25, y: 20 },
    { name: "Engrenagem", code: "KF-D04-03", x: 60, y: 35 },
    { name: "Eixo Balanceador", code: "KF-D04-04", x: 35, y: 75 },
    { name: "Rolamento", code: "KF-D04-05", x: 70, y: 65 },
  ]},
  { id: "injecao", label: "06", name: "Injeção", description: "Bomba injetora, bico injetor, elemento do bico e solenóide", searchTerm: "injetor", image: dieselInjecao, parts: [
    { name: "Bomba Injetora", code: "KF-D06-01", x: 35, y: 30 },
    { name: "Bico Injetor", code: "KF-D06-02", x: 55, y: 20 },
    { name: "Elemento do Bico", code: "KF-D06-03", x: 45, y: 55 },
    { name: "Solenóide", code: "KF-D06-04", x: 65, y: 65 },
  ]},
  { id: "retratil", label: "07", name: "Retrátil (Partida)", description: "Partida retrátil completa, carcaça, mola, corda e cachorrete", searchTerm: "retrátil", image: dieselRetratil, parts: [
    { name: "Retrátil Completo", code: "KF-D07-01", x: 40, y: 25 },
    { name: "Mola", code: "KF-D07-02", x: 55, y: 45 },
    { name: "Corda", code: "KF-D07-03", x: 30, y: 60 },
    { name: "Cachorrete", code: "KF-D07-04", x: 65, y: 70 },
  ]},
  { id: "filtro-ar", label: "08", name: "Filtro de Ar", description: "Conjunto filtro de ar, elemento filtrante, coletor de admissão e juntas", searchTerm: "filtro de ar", image: dieselFiltro, parts: [
    { name: "Elemento Filtrante", code: "KF-D08-01", x: 40, y: 30 },
    { name: "Corpo do Filtro", code: "KF-D08-02", x: 55, y: 55 },
    { name: "Coletor Admissão", code: "KF-D08-03", x: 35, y: 75 },
    { name: "Junta", code: "KF-D08-04", x: 65, y: 45 },
  ]},
  { id: "escape", label: "09", name: "Escape", description: "Escape completo, proteção do escape e parafusos de fixação", searchTerm: "escapamento", image: dieselEscape, parts: [
    { name: "Escape Completo", code: "KF-D09-01", x: 40, y: 35 },
    { name: "Proteção do Escape", code: "KF-D09-02", x: 60, y: 55 },
    { name: "Parafuso Fixação", code: "KF-D09-03", x: 30, y: 70 },
  ]},
  { id: "tampa-lateral", label: "10", name: "Tampa Lateral", description: "Tampa do bloco, junta, retentores, rolamentos, bomba e filtro de óleo", searchTerm: "tampa", image: dieselTampa, parts: [
    { name: "Tampa do Bloco", code: "KF-D10-01", x: 40, y: 25 },
    { name: "Bomba de Óleo", code: "KF-D10-02", x: 55, y: 50 },
    { name: "Filtro de Óleo", code: "KF-D10-03", x: 30, y: 65 },
    { name: "Retentor", code: "KF-D10-04", x: 65, y: 70 },
    { name: "Junta", code: "KF-D10-05", x: 45, y: 40 },
  ]},
  { id: "acelerador-rar", label: "11", name: "Acelerador / RAR", description: "Engrenagem RAR, conjunto acionamento, molas e balancim do RAR", searchTerm: "acelerador", image: dieselAcelerador, parts: [
    { name: "Engrenagem RAR", code: "KF-D11-01", x: 35, y: 30 },
    { name: "Conjunto Acionamento", code: "KF-D11-02", x: 55, y: 45 },
    { name: "Mola", code: "KF-D11-03", x: 40, y: 65 },
    { name: "Balancim RAR", code: "KF-D11-04", x: 65, y: 55 },
  ]},
  { id: "tanque", label: "12", name: "Tanque", description: "Tanque de combustível, tampa, torneira, filtro e tubo de alta pressão", searchTerm: "tanque", image: dieselTanque, parts: [
    { name: "Tanque", code: "KF-D12-01", x: 40, y: 30 },
    { name: "Tampa do Tanque", code: "KF-D12-02", x: 30, y: 15 },
    { name: "Torneira", code: "KF-D12-03", x: 60, y: 65 },
    { name: "Filtro", code: "KF-D12-04", x: 50, y: 50 },
    { name: "Tubo Alta Pressão", code: "KF-D12-05", x: 70, y: 75 },
  ]},
  { id: "carenagem-partida", label: "13", name: "Carenagem / Partida Elétrica", description: "Carenagem, alternador, motor de partida, regulador de tensão e chave", searchTerm: "alternador", image: dieselCarenagem, parts: [
    { name: "Carenagem", code: "KF-D13-01", x: 35, y: 25 },
    { name: "Alternador", code: "KF-D13-02", x: 55, y: 40 },
    { name: "Motor de Partida", code: "KF-D13-03", x: 40, y: 60 },
    { name: "Regulador Tensão", code: "KF-D13-04", x: 65, y: 50 },
    { name: "Chave", code: "KF-D13-05", x: 30, y: 75 },
  ]},
];
