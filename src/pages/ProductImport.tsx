import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Upload, FileText, FileSpreadsheet, Loader2, Check, X, Trash2, Edit,
  ArrowLeft, AlertTriangle, CheckCircle, Download, Eye, ImageIcon,
  FolderArchive, RefreshCw, Search, Package, Wand2, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface ImportProduct {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number | null;
  brand: string;
  weight: string;
  dimensions: string;
  image_url: string;
  image_file?: File;
  image_source?: "spreadsheet" | "zip" | "pdf" | "manual" | "ai" | "placeholder";
  image_description?: string;
  status: "ready" | "error" | "duplicate" | "editing";
  generatingImage?: boolean;
  errorMsg?: string;
  existingProductId?: string;
  updateExisting?: boolean;
}

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  imagesImported: number;
  errors: string[];
}

const BATCH_SIZE = 10;

const ProductImport = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "processing" | "preview" | "importing" | "done">("upload");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [zipFileName, setZipFileName] = useState("");
  const [zipImages, setZipImages] = useState<Map<string, File>>(new Map());
  const [products, setProducts] = useState<ImportProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult>({ created: 0, updated: 0, failed: 0, imagesImported: 0, errors: [] });
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [updateDuplicates, setUpdateDuplicates] = useState(false);
  const [autoGenerateImages, setAutoGenerateImages] = useState(true);
  const [generatingImages, setGeneratingImages] = useState(false);

  const genId = () => crypto.randomUUID();
  const generateSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name, slug");
    setCategories(data || []);
  };

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsText(file); });

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as ArrayBuffer); r.onerror = reject; r.readAsArrayBuffer(file); });

  const parseCSV = async (file: File): Promise<string> => {
    const text = await readFileAsText(file);
    const result = Papa.parse(text, { header: true });
    const rows = result.data as Record<string, string>[];
    const lines = rows.map((row) => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(" | "));
    return `Tabela CSV com ${rows.length} linhas:\n${Object.keys(rows[0] || {}).join(" | ")}\n${lines.join("\n")}`;
  };

  const parseExcel = async (file: File): Promise<string> => {
    const buffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(buffer, { type: "array" });
    let content = "";
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      content += `Planilha "${sheetName}":\n${XLSX.utils.sheet_to_csv(sheet)}\n\n`;
    }
    return content;
  };

  const parsePDFAsBase64 = async (file: File): Promise<string> => {
    const buffer = await readFileAsArrayBuffer(file);
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  // Handle ZIP file - extract image files
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast({ title: "Formato inválido", description: "Envie um arquivo ZIP contendo imagens.", variant: "destructive" });
      return;
    }
    setZipFileName(file.name);

    try {
      // Use JSZip-like approach with the ZIP format
      const buffer = await readFileAsArrayBuffer(file);
      const images = await extractImagesFromZip(buffer);
      setZipImages(images);
      toast({ title: `ZIP processado`, description: `${images.size} imagens encontradas no arquivo ZIP.` });
    } catch (err: any) {
      console.error("ZIP error:", err);
      toast({ title: "Erro ao processar ZIP", description: err.message, variant: "destructive" });
    }
  };

  // Simple ZIP extraction for images
  const extractImagesFromZip = async (buffer: ArrayBuffer): Promise<Map<string, File>> => {
    const images = new Map<string, File>();
    const view = new DataView(buffer);
    const decoder = new TextDecoder();
    let offset = 0;

    while (offset < buffer.byteLength - 4) {
      const sig = view.getUint32(offset, true);
      if (sig !== 0x04034b50) break; // Local file header signature

      const compMethod = view.getUint16(offset + 8, true);
      const compSize = view.getUint32(offset + 18, true);
      const uncompSize = view.getUint32(offset + 22, true);
      const nameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);
      const nameBytes = new Uint8Array(buffer, offset + 30, nameLen);
      const fileName = decoder.decode(nameBytes);
      const dataOffset = offset + 30 + nameLen + extraLen;

      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      const isImage = ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(ext);

      if (isImage && compMethod === 0 && uncompSize > 0) {
        // Stored (no compression) - we can read directly
        const imageData = new Uint8Array(buffer, dataOffset, uncompSize);
        const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        const blob = new Blob([imageData], { type: mimeType });
        const baseName = fileName.split("/").pop()?.replace(/\.[^.]+$/, "").toLowerCase() || "";
        if (baseName) {
          images.set(baseName, new File([blob], fileName.split("/").pop() || fileName, { type: mimeType }));
        }
      }

      offset = dataOffset + compSize;
    }

    return images;
  };

  // Match ZIP image to product by SKU or name
  const matchZipImage = (product: ImportProduct): File | undefined => {
    if (zipImages.size === 0) return undefined;
    // Try exact SKU match
    if (product.sku) {
      const skuKey = product.sku.toLowerCase().trim();
      if (zipImages.has(skuKey)) return zipImages.get(skuKey);
    }
    // Try slug match
    const slug = generateSlug(product.name);
    if (zipImages.has(slug)) return zipImages.get(slug);
    // Try partial name match
    const nameLower = product.name.toLowerCase();
    for (const [key, file] of zipImages) {
      if (nameLower.includes(key) || key.includes(nameLower.split(" ")[0])) return file;
    }
    return undefined;
  };

  // Check for duplicate SKUs in the database
  const checkDuplicates = async (parsed: ImportProduct[]): Promise<ImportProduct[]> => {
    const skus = parsed.filter(p => p.sku).map(p => p.sku);
    if (skus.length === 0) return parsed;

    const { data: existing } = await supabase
      .from("products")
      .select("id, sku, name")
      .in("sku", skus);

    const existingMap = new Map((existing || []).map(p => [p.sku, p]));

    return parsed.map(p => {
      if (p.sku && existingMap.has(p.sku)) {
        const ex = existingMap.get(p.sku)!;
        return { ...p, status: "duplicate" as const, existingProductId: ex.id, updateExisting: updateDuplicates, errorMsg: `SKU "${p.sku}" já existe (${ex.name})` };
      }
      return p;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls", "pdf"].includes(ext)) {
      toast({ title: "Formato inválido", description: "Aceitos: PDF, Excel (.xlsx/.xls) ou CSV", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    setFileType(ext);
    setStep("processing");
    setProgressMessage("Carregando categorias...");
    await loadCategories();

    try {
      setProgressMessage("Lendo arquivo...");
      let content = "";
      if (ext === "csv") content = await parseCSV(file);
      else if (ext === "xlsx" || ext === "xls") content = await parseExcel(file);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      let pdfBase64: string | undefined;
      if (ext === "pdf") {
        setProgressMessage("Convertendo PDF para análise...");
        pdfBase64 = await parsePDFAsBase64(file);
      }

      setProgressMessage("IA analisando o documento...");
      const { data, error } = await supabase.functions.invoke("parse-catalog", {
        body: { content: ext === "pdf" ? undefined : content, fileType: ext, fileName: file.name, pdfBase64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProgressMessage("Processando produtos encontrados...");
      let parsed: ImportProduct[] = (data?.products || []).map((p: any) => {
        const product: ImportProduct = {
          id: genId(),
          name: p.name || "Produto sem nome",
          sku: p.sku || "",
          description: p.description || "",
          category: p.category || "Sem categoria",
          price: p.price ? Number(p.price) : null,
          brand: p.brand || "",
          weight: p.weight || "",
          dimensions: p.dimensions || "",
          image_url: "",
          image_source: undefined,
          image_description: p.image_description || "",
          status: p.name ? "ready" as const : "error" as const,
          errorMsg: p.name ? undefined : "Nome do produto não identificado",
        };
        return product;
      });

      // Try to match ZIP images
      if (zipImages.size > 0) {
        setProgressMessage("Associando imagens do ZIP...");
        parsed = parsed.map(p => {
          const zipFile = matchZipImage(p);
          if (zipFile) {
            return { ...p, image_file: zipFile, image_url: URL.createObjectURL(zipFile), image_source: "zip" as const };
          }
          return p;
        });
      }

      // Check for duplicates
      setProgressMessage("Verificando duplicatas...");
      parsed = await checkDuplicates(parsed);

      if (parsed.length === 0) {
        toast({ title: "Nenhum produto encontrado", description: "O sistema não conseguiu identificar produtos neste arquivo.", variant: "destructive" });
        setStep("upload");
        return;
      }
      setProducts(parsed);
      setStep("preview");

      const withImages = parsed.filter(p => p.image_file).length;
      const dupes = parsed.filter(p => p.status === "duplicate").length;
      toast({
        title: `${parsed.length} produtos encontrados!`,
        description: `${withImages} com imagem${dupes > 0 ? `, ${dupes} duplicatas` : ""}. Revise antes de importar.`,
      });
    } catch (err: any) {
      console.error("Import error:", err);
      toast({ title: "Erro ao processar arquivo", description: err.message || "Erro desconhecido", variant: "destructive" });
      setStep("upload");
    }
  };

  const updateProduct = (id: string, field: keyof ImportProduct, value: any) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleDuplicateUpdate = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id && p.status === "duplicate") {
        return { ...p, updateExisting: !p.updateExisting };
      }
      return p;
    }));
  };

  const handleImageUpload = (productId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, image_file: file, image_url: previewUrl, image_source: "manual" as const } : p
    ));
  };

  const generateAIImage = async (product: ImportProduct): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-product-image", {
        body: {
          productName: product.name,
          imageDescription: product.image_description || product.description,
          sku: product.sku,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.imageUrl || null;
    } catch (err: any) {
      console.error("AI image gen error:", err);
      return null;
    }
  };

  const generateAllAIImages = async () => {
    const productsWithoutImage = products.filter(p => !p.image_file && !p.image_url && p.status !== "error");
    if (productsWithoutImage.length === 0) {
      toast({ title: "Todos os produtos já possuem imagem" });
      return;
    }
    setGeneratingImages(true);
    let generated = 0;
    for (const p of productsWithoutImage) {
      setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, generatingImage: true } : pr));
      const imageUrl = await generateAIImage(p);
      if (imageUrl) {
        generated++;
        setProducts(prev => prev.map(pr =>
          pr.id === p.id ? { ...pr, image_url: imageUrl, image_source: "ai" as const, generatingImage: false } : pr
        ));
      } else {
        setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, generatingImage: false } : pr));
      }
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1500));
    }
    setGeneratingImages(false);
    toast({ title: `${generated} imagens geradas por IA`, description: `De ${productsWithoutImage.length} produtos sem imagem.` });
  };

  const uploadImageFile = async (file: File, sku: string): Promise<string | null> => {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const folder = sku ? generateSlug(sku) : crypto.randomUUID();
      const path = `products/${folder}/imagem-principal.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        contentType: file.type,
        upsert: true,
      });
      if (error) { console.error("Upload error:", error); return null; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      return data?.publicUrl || null;
    } catch (err) {
      console.error("Image upload error:", err);
      return null;
    }
  };

  const getOrCreateCategory = async (categoryName: string): Promise<string | null> => {
    if (!categoryName || categoryName === "Sem categoria") return null;
    const slug = generateSlug(categoryName);
    const existing = categories.find(c => c.slug === slug || c.name.toLowerCase() === categoryName.toLowerCase());
    if (existing) return existing.id;
    const { data, error } = await supabase.from("categories").insert({ name: categoryName, slug }).select("id").single();
    if (error || !data) return null;
    setCategories(prev => [...prev, { id: data.id, name: categoryName, slug }]);
    return data.id;
  };

  const generateAltText = (product: ImportProduct): string => {
    const parts = [product.name];
    if (product.brand) parts.push(product.brand);
    if (product.category && product.category !== "Sem categoria") parts.push(product.category);
    return parts.join(" - ");
  };

  const confirmImport = async () => {
    const validProducts = products.filter(p =>
      (p.status === "ready") || (p.status === "duplicate" && p.updateExisting)
    );
    if (validProducts.length === 0) {
      toast({ title: "Nenhum produto válido para importar", variant: "destructive" });
      return;
    }
    setStep("importing");
    setImportProgress(0);

    let created = 0, updated = 0, failed = 0, imagesImported = 0;
    const errors: string[] = [];
    const total = validProducts.length;

    // Process in batches
    for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
      const batch = validProducts.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (p) => {
        try {
          const categoryId = await getOrCreateCategory(p.category);
          let finalImageUrl: string | null = null;

          if (p.image_file) {
            finalImageUrl = await uploadImageFile(p.image_file, p.sku || p.name);
            if (finalImageUrl) imagesImported++;
          } else if (p.image_url && p.image_source === "ai") {
            // Already uploaded by AI generation
            finalImageUrl = p.image_url;
            imagesImported++;
          } else if (autoGenerateImages && !p.image_url) {
            // Auto-generate with AI during import
            setProgressMessage(`Gerando imagem IA para "${p.name}"...`);
            const aiUrl = await generateAIImage(p);
            if (aiUrl) {
              finalImageUrl = aiUrl;
              imagesImported++;
            }
            // Delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 1500));
          }

          const slug = generateSlug(p.name);
          const productData = {
            name: p.name,
            sku: p.sku || null,
            description: p.description || null,
            price: p.price || 0,
            category_id: categoryId,
            image_url: finalImageUrl,
            stock_quantity: 0,
            is_active: true,
            is_featured: false,
          };

          if (p.status === "duplicate" && p.updateExisting && p.existingProductId) {
            const { error } = await supabase.from("products").update(productData).eq("id", p.existingProductId);
            if (error) throw error;
            updated++;
          } else {
            const { error } = await supabase.from("products").insert(productData);
            if (error) throw error;
            created++;
          }
        } catch (err: any) {
          failed++;
          errors.push(`${p.name}: ${err.message}`);
        }
      });

      await Promise.all(batchPromises);
      setImportProgress(Math.round(((i + batch.length) / total) * 100));
      setProgressMessage(`Processados ${Math.min(i + batch.length, total)} de ${total} produtos...`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("import_logs").insert({
      user_id: user?.id || "", file_name: fileName, file_type: fileType,
      products_created: created, products_failed: failed,
      status: failed > 0 ? "partial" : "completed", error_details: errors,
    } as any);

    setImportResult({ created, updated, failed, imagesImported, errors });
    setStep("done");
    toast({ title: "Importação concluída!", description: `${created} criados, ${updated} atualizados${failed > 0 ? `, ${failed} erros` : ""}.` });
  };

  const readyCount = products.filter(p => p.status === "ready").length;
  const duplicateCount = products.filter(p => p.status === "duplicate").length;
  const updatableCount = products.filter(p => p.status === "duplicate" && p.updateExisting).length;
  const errorCount = products.filter(p => p.status === "error").length;
  const withImageCount = products.filter(p => p.image_file || p.image_url).length;
  const totalImportable = readyCount + updatableCount;

  const filteredProducts = searchFilter
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.category.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : products;

  return (
    <div className="min-h-screen bg-muted/50 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Importar Catálogo</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Importe produtos automaticamente via PDF, Excel ou CSV com IA
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto">
          {[
            { key: "upload", label: "Upload" },
            { key: "processing", label: "Processando" },
            { key: "preview", label: "Revisão" },
            { key: "importing", label: "Importando" },
            { key: "done", label: "Concluído" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                step === s.key ? "bg-primary text-primary-foreground" :
                ["upload", "processing", "preview", "importing", "done"].indexOf(step) > i
                  ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {["upload", "processing", "preview", "importing", "done"].indexOf(step) > i ? (
                  <Check className="h-3 w-3" />
                ) : null}
                {s.label}
              </div>
              {i < 4 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* STEP: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* Main file upload */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-10">
              <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Arquivo Principal
              </h3>
              <div
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex justify-center gap-4 mb-6">
                  <div className="bg-destructive/10 rounded-xl p-4"><FileText className="h-10 w-10 text-destructive" /></div>
                  <div className="bg-primary/10 rounded-xl p-4"><FileSpreadsheet className="h-10 w-10 text-primary" /></div>
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">Arraste ou clique para enviar</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  <Badge variant="outline">PDF</Badge>{" "}
                  <Badge variant="outline">Excel (.xlsx/.xls)</Badge>{" "}
                  <Badge variant="outline">CSV</Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  A IA analisa o documento e extrai automaticamente todos os produtos, incluindo imagens de PDFs.
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
            </div>

            {/* ZIP upload */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-10">
              <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                <FolderArchive className="h-5 w-5 text-primary" /> Imagens em ZIP (Opcional)
              </h3>
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => zipInputRef.current?.click()}
              >
                {zipFileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{zipFileName}</p>
                      <p className="text-xs text-muted-foreground">{zipImages.size} imagens encontradas</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setZipFileName(""); setZipImages(new Map()); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <FolderArchive className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium mb-1">Envie um ZIP com imagens dos produtos</p>
                    <p className="text-xs text-muted-foreground">
                      Nomeie os arquivos com o SKU ou nome do produto (ex: 12345.jpg, filtro-ar.png)
                    </p>
                  </>
                )}
              </div>
              <input ref={zipInputRef} type="file" accept=".zip" className="hidden" onChange={handleZipUpload} />
            </div>

            {/* Options */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
              <h3 className="font-heading text-lg font-bold mb-4">Opções de Importação</h3>
              <div className="flex items-center gap-3">
                <Switch checked={updateDuplicates} onCheckedChange={setUpdateDuplicates} id="update-dupes" />
                <Label htmlFor="update-dupes" className="text-sm">Atualizar produtos existentes com mesmo SKU</Label>
              </div>
            </div>
          </div>
        )}

        {/* STEP: Processing */}
        {step === "processing" && (
          <div className="bg-card rounded-2xl shadow-lg border border-border p-16 text-center">
            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-6" />
            <h3 className="font-heading text-xl font-bold mb-2">Processando "{fileName}"</h3>
            <p className="text-muted-foreground text-sm mb-4">{progressMessage}</p>
            <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos para catálogos grandes</p>
          </div>
        )}

        {/* STEP: Preview */}
        {step === "preview" && (
          <div>
            {/* Summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <FileText className="h-4 w-4 mr-1" /> {fileName}
                </Badge>
                <Badge className="text-sm px-3 py-1 bg-primary/10 text-primary border-primary/20">
                  <Package className="h-3 w-3 mr-1" /> {readyCount} prontos
                </Badge>
                {duplicateCount > 0 && (
                  <Badge className="text-sm px-3 py-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <RefreshCw className="h-3 w-3 mr-1" /> {duplicateCount} duplicatas
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-sm px-3 py-1">{errorCount} com erro</Badge>
                )}
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <ImageIcon className="h-3 w-3 mr-1" /> {withImageCount} com imagem
                </Badge>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setStep("upload"); setProducts([]); }}>
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button onClick={confirmImport} disabled={totalImportable === 0}>
                  <Check className="h-4 w-4 mr-2" /> Confirmar Importação ({totalImportable})
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por nome, SKU ou categoria..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Imagem</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">SKU</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36">Categoria</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">Preço</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Status</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${p.status === "duplicate" ? "bg-amber-500/5" : p.status === "error" ? "bg-destructive/5" : ""}`}>
                        {/* Image column */}
                        <td className="p-3">
                          <div className="relative group">
                            {p.image_url ? (
                              <div className="relative">
                                <img
                                  src={p.image_url}
                                  alt={generateAltText(p)}
                                  className="h-14 w-14 rounded-lg object-cover border border-border"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                {p.image_source && (
                                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] px-1 rounded">
                                    {p.image_source === "zip" ? "ZIP" : p.image_source === "manual" ? "UP" : ""}
                                  </span>
                                )}
                                <label className="absolute inset-0 flex items-center justify-center bg-foreground/50 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                  <Edit className="h-4 w-4 text-background" />
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleImageUpload(p.id, f);
                                  }} />
                                </label>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-14 w-14 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[8px] text-muted-foreground mt-0.5">Upload</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleImageUpload(p.id, f);
                                }} />
                              </label>
                            )}
                          </div>
                        </td>
                        {/* Product info */}
                        <td className="p-3">
                          {editingId === p.id ? (
                            <div className="space-y-1">
                              <Input value={p.name} onChange={(e) => updateProduct(p.id, "name", e.target.value)} className="text-sm h-8" placeholder="Nome" />
                              <Textarea value={p.description} onChange={(e) => updateProduct(p.id, "description", e.target.value)} className="text-xs" rows={2} placeholder="Descrição" />
                              <div className="flex gap-2">
                                <Input value={p.weight} onChange={(e) => updateProduct(p.id, "weight", e.target.value)} className="text-xs h-7 w-24" placeholder="Peso" />
                                <Input value={p.dimensions} onChange={(e) => updateProduct(p.id, "dimensions", e.target.value)} className="text-xs h-7 w-32" placeholder="Dimensões" />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-sm">{p.name}</p>
                              {p.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>}
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {p.brand && <Badge variant="outline" className="text-[10px]">{p.brand}</Badge>}
                                {p.weight && <Badge variant="outline" className="text-[10px]">{p.weight}</Badge>}
                                {p.dimensions && <Badge variant="outline" className="text-[10px]">{p.dimensions}</Badge>}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {editingId === p.id ? (
                            <Input value={p.sku} onChange={(e) => updateProduct(p.id, "sku", e.target.value)} className="text-sm h-8 w-28" />
                          ) : (
                            <span className="text-sm text-muted-foreground font-mono">{p.sku || "—"}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {editingId === p.id ? (
                            <Input value={p.category} onChange={(e) => updateProduct(p.id, "category", e.target.value)} className="text-sm h-8 w-36" />
                          ) : (
                            <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {editingId === p.id ? (
                            <Input type="number" step="0.01" value={p.price ?? ""} onChange={(e) => updateProduct(p.id, "price", e.target.value ? Number(e.target.value) : null)} className="text-sm h-8 w-24" />
                          ) : (
                            <span className="text-sm font-medium">
                              {p.price != null ? `R$ ${p.price.toFixed(2).replace(".", ",")}` : "—"}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {p.status === "ready" && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" /> Pronto
                            </Badge>
                          )}
                          {p.status === "duplicate" && (
                            <div className="space-y-1">
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                                <RefreshCw className="h-3 w-3 mr-1" /> Duplicata
                              </Badge>
                              <button
                                onClick={() => toggleDuplicateUpdate(p.id)}
                                className={`text-[10px] block px-2 py-0.5 rounded ${p.updateExisting ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                              >
                                {p.updateExisting ? "✓ Atualizar" : "Ignorar"}
                              </button>
                            </div>
                          )}
                          {p.status === "error" && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Erro
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(editingId === p.id ? null : p.id)}>
                              {editingId === p.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Edit className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeProduct(p.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STEP: Importing */}
        {step === "importing" && (
          <div className="bg-card rounded-2xl shadow-lg border border-border p-16 text-center">
            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-6" />
            <h3 className="font-heading text-xl font-bold mb-2">Importando produtos...</h3>
            <p className="text-muted-foreground text-sm mb-6">{progressMessage}</p>
            <div className="max-w-md mx-auto">
              <Progress value={importProgress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">{importProgress}% concluído</p>
            </div>
          </div>
        )}

        {/* STEP: Done */}
        {step === "done" && (
          <div className="bg-card rounded-2xl shadow-lg border border-border p-10">
            <div className="text-center mb-8">
              <CheckCircle className="h-20 w-20 text-primary mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-bold mb-2">Importação Concluída!</h3>
              <p className="text-muted-foreground">Arquivo: <span className="font-medium">{fileName}</span></p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
              <div className="bg-primary/10 rounded-xl p-5 text-center border border-primary/20">
                <p className="text-3xl font-bold text-primary">{importResult.created}</p>
                <p className="text-xs text-muted-foreground mt-1">Produtos criados</p>
              </div>
              <div className="bg-blue-500/10 rounded-xl p-5 text-center border border-blue-500/20">
                <p className="text-3xl font-bold text-blue-600">{importResult.updated}</p>
                <p className="text-xs text-muted-foreground mt-1">Atualizados</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-5 text-center border border-green-500/20">
                <p className="text-3xl font-bold text-green-600">{importResult.imagesImported}</p>
                <p className="text-xs text-muted-foreground mt-1">Imagens importadas</p>
              </div>
              <div className={`rounded-xl p-5 text-center border ${importResult.failed > 0 ? "bg-destructive/10 border-destructive/20" : "bg-muted border-border"}`}>
                <p className={`text-3xl font-bold ${importResult.failed > 0 ? "text-destructive" : "text-muted-foreground"}`}>{importResult.failed}</p>
                <p className="text-xs text-muted-foreground mt-1">Erros</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6 max-w-lg mx-auto">
                <h4 className="font-semibold text-sm text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Erros encontrados:
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {importResult.errors.slice(0, 10).map((e, i) => <li key={i}>• {e}</li>)}
                  {importResult.errors.length > 10 && <li>... e mais {importResult.errors.length - 10} erros</li>}
                </ul>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => { setStep("upload"); setProducts([]); setImportProgress(0); }}>
                <Upload className="h-4 w-4 mr-2" /> Nova Importação
              </Button>
              <Button onClick={() => navigate("/admin")}>
                <Eye className="h-4 w-4 mr-2" /> Ver no Painel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImport;
