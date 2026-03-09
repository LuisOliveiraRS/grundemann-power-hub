export interface CatalogSection {
  id: string;
  label: string;
  name: string;
  description: string;
  searchTerm: string;
}

export const gasolineSections: CatalogSection[] = [
  { id: "cabecote", label: "01", name: "Cabeçote", description: "Tampa, válvulas, varetas, balancins, eixo de comando e componentes do cabeçote", searchTerm: "cabeçote" },
  { id: "pistao-biela", label: "02", name: "Pistão / Biela", description: "Pistão, pino, anéis, biela e bronzinas", searchTerm: "pistão" },
  { id: "bloco", label: "03", name: "Bloco do Motor", description: "Bloco, retentores, bujões, interruptores de nível de óleo e chapas defletoras", searchTerm: "bloco" },
  { id: "volante-virabrequim", label: "04", name: "Volante / Virabrequim", description: "Eixo virabrequim, volante magnético, rolamentos, chavetas e ventoinhas", searchTerm: "virabrequim" },
  { id: "carburador", label: "05", name: "Carburador", description: "Carburador completo, cuba, bóia, gicleurs, juntas e coletor de admissão", searchTerm: "carburador" },
  { id: "retratil", label: "07", name: "Retrátil (Partida)", description: "Partida retrátil completa, carcaça, mola, corda, punho e cachorrete", searchTerm: "retrátil" },
  { id: "filtro-ar", label: "08", name: "Filtro de Ar", description: "Conjunto filtro de ar, elemento filtrante, suporte e corpo do filtro", searchTerm: "filtro de ar" },
  { id: "escape", label: "09", name: "Escape", description: "Escape completo, coletor de escape, junta e direcionador de fumaça", searchTerm: "escapamento" },
  { id: "tampa-lateral", label: "10", name: "Tampa Lateral", description: "Tampa carcaça, junta, retentores, rolamentos e jogo de juntas", searchTerm: "tampa" },
  { id: "acelerador-rar", label: "11", name: "Acelerador / RAR", description: "Conjunto RAR, braço, molas de retorno, alavanca e haste de ligação", searchTerm: "acelerador" },
  { id: "tanque", label: "12", name: "Tanque", description: "Tanque de combustível, tampa, peneira, mangueira e torneira", searchTerm: "tanque" },
  { id: "carenagem-partida", label: "13", name: "Carenagem / Partida Elétrica", description: "Carenagem, bobina de ignição/luz, motor de partida, painel e chave", searchTerm: "bobina" },
];
