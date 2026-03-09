import type { CatalogSection } from "./gasolineEngineParts";

export const dieselSections: CatalogSection[] = [
  { id: "cabecote", label: "01", name: "Cabeçote", description: "Tampa, válvulas, varetas, balancins, eixo de comando, descompressor e bico injetor", searchTerm: "cabeçote" },
  { id: "pistao-biela", label: "02", name: "Pistão / Biela", description: "Pistão, pino, anéis, biela e bronzinas", searchTerm: "pistão" },
  { id: "bloco", label: "03", name: "Bloco do Motor", description: "Bloco, retentores, rolamentos, prisioneiros e chapas defletoras", searchTerm: "bloco" },
  { id: "volante-virabrequim", label: "04", name: "Volante / Virabrequim", description: "Eixo virabrequim, volante, rolamentos, engrenagens e eixo balanceador", searchTerm: "virabrequim" },
  { id: "injecao", label: "06", name: "Injeção", description: "Bomba injetora, bico injetor, elemento do bico e solenóide", searchTerm: "injetor" },
  { id: "retratil", label: "07", name: "Retrátil (Partida)", description: "Partida retrátil completa, carcaça, mola, corda e cachorrete", searchTerm: "retrátil" },
  { id: "filtro-ar", label: "08", name: "Filtro de Ar", description: "Conjunto filtro de ar, elemento filtrante, coletor de admissão e juntas", searchTerm: "filtro de ar" },
  { id: "escape", label: "09", name: "Escape", description: "Escape completo, proteção do escape e parafusos de fixação", searchTerm: "escapamento" },
  { id: "tampa-lateral", label: "10", name: "Tampa Lateral", description: "Tampa do bloco, junta, retentores, rolamentos, bomba e filtro de óleo", searchTerm: "tampa" },
  { id: "acelerador-rar", label: "11", name: "Acelerador / RAR", description: "Engrenagem RAR, conjunto acionamento, molas e balancim do RAR", searchTerm: "acelerador" },
  { id: "tanque", label: "12", name: "Tanque", description: "Tanque de combustível, tampa, torneira, filtro e tubo de alta pressão", searchTerm: "tanque" },
  { id: "carenagem-partida", label: "13", name: "Carenagem / Partida Elétrica", description: "Carenagem, alternador, motor de partida, regulador de tensão e chave", searchTerm: "alternador" },
];
