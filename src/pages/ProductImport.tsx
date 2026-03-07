import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload, FileText, FileSpreadsheet, Loader2, Check, X, Trash2, Edit,
  ArrowLeft, AlertTriangle, CheckCircle, Download, Eye
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
  image_url: string;
  status: "ready" | "error" | "editing";
  errorMsg?: string;
}

const ProductImport = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "processing" | "preview" | "importing" | "done">("upload");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [products, setProducts] = useState<ImportProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState({ created: 0, failed: 0, errors: [] as string[] });
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  const genId = () => crypto.randomUUID();

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name, slug");
    setCategories(data || []);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSV = async (file: File): Promise<string> => {
    const text = await readFileAsText(file);
    const result = Papa.parse(text, { header: true });
    // Format as readable text for AI
    const rows = result.data as Record<string, string>[];
    const lines = rows.map((row, i) => {
      return Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(" | ");
    });
    return `Tabela CSV com ${rows.length} linhas:\n${Object.keys(rows[0] || {}).join(" | ")}\n${lines.join("\n")}`;
  };

  const parseExcel = async (file: File): Promise<string> => {
    const buffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(buffer, { type: "array" });
    let content = "";
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_csv(sheet);
      content += `Planilha "${sheetName}":\n${data}\n\n`;
    }
    return content;
  };

  const parsePDFAsBase64 = async (file: File): Promise<string> => {
    const buffer = await readFileAsArrayBuffer(file);
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const validTypes = ["csv", "xlsx", "xls", "pdf"];
    if (!ext || !validTypes.includes(ext)) {
      toast({ title: "Formato inválido", description: "Aceitos: PDF, Excel (.xlsx) ou CSV", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setFileType(ext);
    setStep("processing");
    await loadCategories();

    try {
      let content = "";

      if (ext === "csv") {
        content = await parseCSV(file);
      } else if (ext === "xlsx" || ext === "xls") {
        content = await parseExcel(file);
      }

      // Send to AI for smart parsing
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      let pdfBase64: string | undefined;
      if (ext === "pdf") {
        pdfBase64 = await parsePDFAsBase64(file);
      }

      const { data, error } = await supabase.functions.invoke("parse-catalog", {
        body: { content: ext === "pdf" ? undefined : content, fileType: ext, fileName: file.name, pdfBase64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const parsed: ImportProduct[] = (data?.products || []).map((p: any) => ({
        id: genId(),
        name: p.name || "Produto sem nome",
        sku: p.sku || "",
        description: p.description || "",
        category: p.category || "Sem categoria",
        price: p.price ? Number(p.price) : null,
        brand: p.brand || "",
        image_url: p.image_url || "",
        status: p.name ? "ready" as const : "error" as const,
        errorMsg: p.name ? undefined : "Nome do produto não identificado",
      }));

      if (parsed.length === 0) {
        toast({ title: "Nenhum produto encontrado", description: "O sistema não conseguiu identificar produtos neste arquivo.", variant: "destructive" });
        setStep("upload");
        return;
      }

      setProducts(parsed);
      setStep("preview");
      toast({ title: `${parsed.length} produtos encontrados!`, description: "Revise os dados antes de importar." });
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

  const getOrCreateCategory = async (categoryName: string): Promise<string | null> => {
    if (!categoryName || categoryName === "Sem categoria") return null;

    const slug = categoryName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = categories.find(c => c.slug === slug || c.name.toLowerCase() === categoryName.toLowerCase());
    if (existing) return existing.id;

    const { data, error } = await supabase.from("categories").insert({ name: categoryName, slug }).select("id").single();
    if (error || !data) return null;

    setCategories(prev => [...prev, { id: data.id, name: categoryName, slug }]);
    return data.id;
  };

  const confirmImport = async () => {
    const validProducts = products.filter(p => p.status !== "error" && p.name);
    if (validProducts.length === 0) {
      toast({ title: "Nenhum produto válido para importar", variant: "destructive" });
      return;
    }

    setStep("importing");
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const p of validProducts) {
      try {
        const categoryId = await getOrCreateCategory(p.category);

        const productData: any = {
          name: p.name,
          sku: p.sku || null,
          description: p.description || null,
          price: p.price || 0,
          category_id: categoryId,
          stock_quantity: 0,
          is_active: true,
          is_featured: false,
        };

        const { error } = await supabase.from("products").insert(productData);
        if (error) throw error;
        created++;
      } catch (err: any) {
        failed++;
        errors.push(`${p.name}: ${err.message}`);
      }
    }

    // Log the import
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("import_logs").insert({
      user_id: user?.id || "",
      file_name: fileName,
      file_type: fileType,
      products_created: created,
      products_failed: failed,
      status: failed > 0 ? "partial" : "completed",
      error_details: errors,
    } as any);

    setImportResult({ created, failed, errors });
    setStep("done");

    toast({
      title: "Importação concluída!",
      description: `${created} produtos criados${failed > 0 ? `, ${failed} com erro` : ""}.`,
    });
  };

  const readyCount = products.filter(p => p.status !== "error").length;
  const errorCount = products.filter(p => p.status === "error").length;

  return (
    <div className="min-h-screen bg-muted/50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Importar Produtos</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Importe produtos automaticamente via PDF, Excel ou CSV com IA
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { key: "upload", label: "Upload" },
            { key: "processing", label: "Processando" },
            { key: "preview", label: "Revisão" },
            { key: "importing", label: "Importando" },
            { key: "done", label: "Concluído" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
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
          <div className="bg-card rounded-2xl shadow-lg border border-border p-10">
            <div
              className="border-2 border-dashed border-border rounded-xl p-16 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex justify-center gap-4 mb-6">
                <div className="bg-destructive/10 rounded-xl p-4"><FileText className="h-10 w-10 text-destructive" /></div>
                <div className="bg-primary/10 rounded-xl p-4"><FileSpreadsheet className="h-10 w-10 text-primary" /></div>
                <div className="bg-secondary/10 rounded-xl p-4"><Download className="h-10 w-10 text-secondary-foreground" /></div>
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">Arraste ou clique para enviar</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Aceitos: <Badge variant="outline">PDF</Badge>{" "}
                <Badge variant="outline">Excel (.xlsx)</Badge>{" "}
                <Badge variant="outline">CSV</Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                O sistema usa IA para identificar produtos automaticamente, mesmo em catálogos sem tabelas estruturadas.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* STEP: Processing */}
        {step === "processing" && (
          <div className="bg-card rounded-2xl shadow-lg border border-border p-16 text-center">
            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-6" />
            <h3 className="font-heading text-xl font-bold mb-2">Processando "{fileName}"</h3>
            <p className="text-muted-foreground text-sm">
              A IA está analisando o documento e identificando produtos...
            </p>
            <p className="text-xs text-muted-foreground mt-4">Isso pode levar alguns segundos</p>
          </div>
        )}

        {/* STEP: Preview */}
        {step === "preview" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <FileText className="h-4 w-4 mr-1" /> {fileName}
                </Badge>
                <Badge className="text-sm px-3 py-1 bg-primary/10 text-primary border-primary/20">
                  {readyCount} prontos
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-sm px-3 py-1">
                    {errorCount} com erro
                  </Badge>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setStep("upload"); setProducts([]); }}>
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button onClick={confirmImport} disabled={readyCount === 0}>
                  <Check className="h-4 w-4 mr-2" /> Confirmar Importação ({readyCount})
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Código</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          {editingId === p.id ? (
                            <div className="space-y-1">
                              <Input
                                value={p.name}
                                onChange={(e) => updateProduct(p.id, "name", e.target.value)}
                                className="text-sm h-8"
                                placeholder="Nome do produto"
                              />
                              <Textarea
                                value={p.description}
                                onChange={(e) => updateProduct(p.id, "description", e.target.value)}
                                className="text-xs"
                                rows={2}
                                placeholder="Descrição"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-sm">{p.name}</p>
                              {p.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                              )}
                              {p.brand && (
                                <Badge variant="outline" className="text-[10px] mt-1">{p.brand}</Badge>
                              )}
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
                            <Input value={p.category} onChange={(e) => updateProduct(p.id, "category", e.target.value)} className="text-sm h-8 w-40" />
                          ) : (
                            <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {editingId === p.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={p.price ?? ""}
                              onChange={(e) => updateProduct(p.id, "price", e.target.value ? Number(e.target.value) : null)}
                              className="text-sm h-8 w-24"
                            />
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
                          {p.status === "error" && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Erro
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                            >
                              {editingId === p.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Edit className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeProduct(p.id)}
                            >
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
            <p className="text-muted-foreground text-sm">
              Cadastrando {readyCount} produtos no catálogo e criando categorias automaticamente.
            </p>
          </div>
        )}

        {/* STEP: Done */}
        {step === "done" && (
          <div className="bg-card rounded-2xl shadow-lg border border-border p-10">
            <div className="text-center mb-8">
              <CheckCircle className="h-20 w-20 text-primary mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-bold mb-2">Importação Concluída!</h3>
              <p className="text-muted-foreground">
                Arquivo: <span className="font-medium">{fileName}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              <div className="bg-primary/10 rounded-xl p-5 text-center border border-primary/20">
                <p className="text-3xl font-bold text-primary">{importResult.created}</p>
                <p className="text-xs text-muted-foreground mt-1">Produtos criados</p>
              </div>
              <div className={`rounded-xl p-5 text-center border ${importResult.failed > 0 ? "bg-destructive/10 border-destructive/20" : "bg-muted border-border"}`}>
                <p className={`text-3xl font-bold ${importResult.failed > 0 ? "text-destructive" : "text-muted-foreground"}`}>{importResult.failed}</p>
                <p className="text-xs text-muted-foreground mt-1">Com erro</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6 max-w-lg mx-auto">
                <h4 className="font-semibold text-sm text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Erros encontrados:
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {importResult.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li className="text-muted-foreground">... e mais {importResult.errors.length - 10} erros</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => { setStep("upload"); setProducts([]); }}>
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
