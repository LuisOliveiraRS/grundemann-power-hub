import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Stethoscope, Cpu, Package, TrendingUp, Search, Eye } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const IntelligentAnalytics = () => {
  const [topProblems, setTopProblems] = useState<any[]>([]);
  const [topModels, setTopModels] = useState<any[]>([]);
  const [topClickedProducts, setTopClickedProducts] = useState<any[]>([]);
  const [topSoldProducts, setTopSoldProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [diagRes, modelRes, itemsRes, productsRes] = await Promise.all([
      supabase.from("diagnostic_search_logs").select("problem_slug").limit(5000),
      supabase.from("model_search_logs").select("model_name").limit(5000),
      supabase.from("order_items").select("product_id, product_name, quantity").limit(5000),
      supabase.from("products").select("id, name, image_url, price").eq("is_active", true).limit(500),
    ]);

    // Top searched problems
    const problemFreq: Record<string, number> = {};
    (diagRes.data || []).forEach((d: any) => {
      problemFreq[d.problem_slug] = (problemFreq[d.problem_slug] || 0) + 1;
    });
    setTopProblems(
      Object.entries(problemFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([slug, count]) => ({ name: slug.replace(/-/g, " "), count }))
    );

    // Top searched models
    const modelFreq: Record<string, number> = {};
    (modelRes.data || []).forEach((m: any) => {
      modelFreq[m.model_name] = (modelFreq[m.model_name] || 0) + 1;
    });
    setTopModels(
      Object.entries(modelFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([name, count]) => ({ name, count }))
    );

    // Top sold products
    const soldFreq: Record<string, { qty: number; name: string }> = {};
    (itemsRes.data || []).forEach((i: any) => {
      if (!i.product_id) return;
      if (!soldFreq[i.product_id]) soldFreq[i.product_id] = { qty: 0, name: i.product_name };
      soldFreq[i.product_id].qty += i.quantity;
    });
    setTopSoldProducts(
      Object.entries(soldFreq)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 10)
        .map(([id, data]) => ({ id, name: data.name, qty: data.qty }))
    );

    // Most viewed = we'll use AI conversation logs as proxy for "clicked products"
    const { data: aiLogs } = await supabase
      .from("ai_conversation_logs")
      .select("problem_identified")
      .not("problem_identified", "is", null)
      .limit(1000);

    const aiProblems: Record<string, number> = {};
    (aiLogs || []).forEach((l: any) => {
      if (l.problem_identified) {
        aiProblems[l.problem_identified] = (aiProblems[l.problem_identified] || 0) + 1;
      }
    });
    setTopClickedProducts(
      Object.entries(aiProblems)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))
    );

    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive/10 p-3"><Stethoscope className="h-6 w-6 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Buscas Diagnóstico</p>
              <p className="text-2xl font-heading font-bold">{topProblems.reduce((s, p) => s + p.count, 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3"><Cpu className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Buscas por Modelo</p>
              <p className="text-2xl font-heading font-bold">{topModels.reduce((s, m) => s + m.count, 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3"><Package className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Peças Vendidas</p>
              <p className="text-2xl font-heading font-bold">{topSoldProducts.reduce((s, p) => s + p.qty, 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-secondary/10 p-3"><Eye className="h-6 w-6 text-secondary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Problemas via IA</p>
              <p className="text-2xl font-heading font-bold">{topClickedProducts.reduce((s, p) => s + p.count, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top searched problems */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-destructive" /> Problemas Mais Pesquisados
          </h3>
          {topProblems.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProblems} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Buscas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma busca registrada ainda. Os dados aparecerão conforme usuários usarem o diagnóstico.</p>
          )}
        </div>

        {/* Top searched models */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" /> Modelos Mais Buscados
          </h3>
          {topModels.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topModels} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Buscas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma busca por modelo registrada ainda.</p>
          )}
        </div>

        {/* Top sold products */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Peças Mais Vendidas
          </h3>
          {topSoldProducts.length > 0 ? (
            <div className="space-y-2">
              {topSoldProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <Badge variant={i < 3 ? "default" : "secondary"} className="w-8 justify-center">{i + 1}º</Badge>
                  <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
                  <span className="text-sm font-bold text-primary">{p.qty} un.</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma venda registrada</p>
          )}
        </div>

        {/* AI-identified problems */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" /> Problemas Identificados pela IA
          </h3>
          {topClickedProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={topClickedProducts} cx="50%" cy="50%" outerRadius={90} dataKey="count"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {topClickedProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum problema identificado pela IA ainda</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligentAnalytics;
