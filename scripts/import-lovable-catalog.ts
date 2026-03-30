import { createClient } from "@supabase/supabase-js";
import { importLovableCatalog } from "../src/lib/lovableCatalogImporter";

const SOURCE = process.env.LOVABLE_SOURCE_URL ?? "https://grundemann-power-hub.lovable.app";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase env variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Iniciando importação a partir de", SOURCE);

  const result = await importLovableCatalog(supabase, SOURCE, (message) => console.log(message));

  console.log(`Categorias importadas: ${result.importedCategories}`);
  console.log(`Produtos importados: ${result.importedProducts}`);
  console.log(`Produtos com falha: ${result.failedProducts}`);
  if (result.logs.length) {
    console.log("Erros:", result.logs.join("\n"));
  }

  console.log("Importação concluída.");
}

main().catch((error) => {
  console.error("Erro na importação:", error);
  process.exit(1);
});
