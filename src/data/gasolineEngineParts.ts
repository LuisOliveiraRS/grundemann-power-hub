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

export interface CatalogSection {
  id: string;
  label: string;
  name: string;
  description: string;
  searchTerm: string;
  image: string;
}

export const gasolineSections: CatalogSection[] = [
  { id: "cabecote", label: "01", name: "Cabeçote", description: "Tampa, válvulas, varetas, balancins, eixo de comando e componentes do cabeçote", searchTerm: "cabeçote", image: gasCabecote },
  { id: "pistao-biela", label: "02", name: "Pistão / Biela", description: "Pistão, pino, anéis, biela e bronzinas", searchTerm: "pistão", image: gasPistao },
  { id: "bloco", label: "03", name: "Bloco do Motor", description: "Bloco, retentores, bujões, interruptores de nível de óleo e chapas defletoras", searchTerm: "bloco", image: gasBloco },
  { id: "volante-virabrequim", label: "04", name: "Volante / Virabrequim", description: "Eixo virabrequim, volante magnético, rolamentos, chavetas e ventoinhas", searchTerm: "virabrequim", image: gasVolante },
  { id: "carburador", label: "05", name: "Carburador", description: "Carburador completo, cuba, bóia, gicleurs, juntas e coletor de admissão", searchTerm: "carburador", image: gasCarburador },
  { id: "retratil", label: "07", name: "Retrátil (Partida)", description: "Partida retrátil completa, carcaça, mola, corda, punho e cachorrete", searchTerm: "retrátil", image: gasRetratil },
  { id: "filtro-ar", label: "08", name: "Filtro de Ar", description: "Conjunto filtro de ar, elemento filtrante, suporte e corpo do filtro", searchTerm: "filtro de ar", image: gasFiltro },
  { id: "escape", label: "09", name: "Escape", description: "Escape completo, coletor de escape, junta e direcionador de fumaça", searchTerm: "escapamento", image: gasEscape },
  { id: "tampa-lateral", label: "10", name: "Tampa Lateral", description: "Tampa carcaça, junta, retentores, rolamentos e jogo de juntas", searchTerm: "tampa", image: gasTampa },
  { id: "acelerador-rar", label: "11", name: "Acelerador / RAR", description: "Conjunto RAR, braço, molas de retorno, alavanca e haste de ligação", searchTerm: "acelerador", image: gasAcelerador },
  { id: "tanque", label: "12", name: "Tanque", description: "Tanque de combustível, tampa, peneira, mangueira e torneira", searchTerm: "tanque", image: gasTanque },
  { id: "carenagem-partida", label: "13", name: "Carenagem / Partida Elétrica", description: "Carenagem, bobina de ignição/luz, motor de partida, painel e chave", searchTerm: "bobina", image: gasCarenagem },
];
