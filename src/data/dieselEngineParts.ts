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
  { id: "cabecote", label: "01", name: "Cabeçote", description: "Tampa, válvulas, varetas, balancins, eixo de comando, descompressor e bico injetor", searchTerm: "cabeçote", image: dieselCabecote },
  { id: "pistao-biela", label: "02", name: "Pistão / Biela", description: "Pistão, pino, anéis, biela e bronzinas", searchTerm: "pistão", image: dieselPistao },
  { id: "bloco", label: "03", name: "Bloco do Motor", description: "Bloco, retentores, rolamentos, prisioneiros e chapas defletoras", searchTerm: "bloco", image: dieselBloco },
  { id: "volante-virabrequim", label: "04", name: "Volante / Virabrequim", description: "Eixo virabrequim, volante, rolamentos, engrenagens e eixo balanceador", searchTerm: "virabrequim", image: dieselVolante },
  { id: "injecao", label: "06", name: "Injeção", description: "Bomba injetora, bico injetor, elemento do bico e solenóide", searchTerm: "injetor", image: dieselInjecao },
  { id: "retratil", label: "07", name: "Retrátil (Partida)", description: "Partida retrátil completa, carcaça, mola, corda e cachorrete", searchTerm: "retrátil", image: dieselRetratil },
  { id: "filtro-ar", label: "08", name: "Filtro de Ar", description: "Conjunto filtro de ar, elemento filtrante, coletor de admissão e juntas", searchTerm: "filtro de ar", image: dieselFiltro },
  { id: "escape", label: "09", name: "Escape", description: "Escape completo, proteção do escape e parafusos de fixação", searchTerm: "escapamento", image: dieselEscape },
  { id: "tampa-lateral", label: "10", name: "Tampa Lateral", description: "Tampa do bloco, junta, retentores, rolamentos, bomba e filtro de óleo", searchTerm: "tampa", image: dieselTampa },
  { id: "acelerador-rar", label: "11", name: "Acelerador / RAR", description: "Engrenagem RAR, conjunto acionamento, molas e balancim do RAR", searchTerm: "acelerador", image: dieselAcelerador },
  { id: "tanque", label: "12", name: "Tanque", description: "Tanque de combustível, tampa, torneira, filtro e tubo de alta pressão", searchTerm: "tanque", image: dieselTanque },
  { id: "carenagem-partida", label: "13", name: "Carenagem / Partida Elétrica", description: "Carenagem, alternador, motor de partida, regulador de tensão e chave", searchTerm: "alternador", image: dieselCarenagem },
];
