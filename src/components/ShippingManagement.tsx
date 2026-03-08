import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Truck, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ShippingRate {
  id: string;
  region_code: string;
  region_label: string;
  pac_price: number;
  pac_days: string;
  sedex_price: number;
  sedex_days: string;
  is_active: boolean;
}

const ShippingManagement = () => {
  const { toast } = useToast();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Record<string, Partial<ShippingRate>>>({});

  const fetchRates = async () => {
    const { data } = await supabase.from("shipping_rates").select("*").order("region_label");
    setRates((data as ShippingRate[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRates(); }, []);

  const updateField = (id: string, field: keyof ShippingRate, value: any) => {
    setEdited(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const getValue = (rate: ShippingRate, field: keyof ShippingRate) => {
    return edited[rate.id]?.[field] !== undefined ? edited[rate.id][field] : rate[field];
  };

  const saveAll = async () => {
    setSaving(true);
    const ids = Object.keys(edited);
    let errorCount = 0;

    for (const id of ids) {
      const updates = edited[id];
      const { error } = await supabase.from("shipping_rates").update(updates).eq("id", id);
      if (error) errorCount++;
    }

    if (errorCount > 0) {
      toast({ title: "Erro ao salvar", description: `${errorCount} regiões com erro`, variant: "destructive" });
    } else {
      toast({ title: `${ids.length} regiões atualizadas!` });
      setEdited({});
    }
    setSaving(false);
    fetchRates();
  };

  const hasChanges = Object.keys(edited).length > 0;

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Tabela de Frete por Região
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Edite os valores de PAC e SEDEX por região. Origem: RS.
          </p>
        </div>
        {hasChanges && (
          <Button onClick={saveAll} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações ({Object.keys(edited).length})
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Região</th>
              <th className="text-center p-3 font-medium">PAC (R$)</th>
              <th className="text-center p-3 font-medium">PAC (dias)</th>
              <th className="text-center p-3 font-medium">SEDEX (R$)</th>
              <th className="text-center p-3 font-medium">SEDEX (dias)</th>
              <th className="text-center p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rates.map(rate => {
              const isEdited = !!edited[rate.id];
              return (
                <tr key={rate.id} className={`border-t border-border hover:bg-muted/30 ${isEdited ? "bg-primary/5" : ""}`}>
                  <td className="p-3">
                    <p className="font-medium">{rate.region_label}</p>
                    <p className="text-xs text-muted-foreground">{rate.region_code}</p>
                  </td>
                  <td className="p-2 text-center">
                    <Input
                      type="number"
                      step="0.10"
                      className="w-24 mx-auto text-center h-8 text-sm"
                      value={getValue(rate, "pac_price") as number}
                      onChange={e => updateField(rate.id, "pac_price", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Input
                      className="w-20 mx-auto text-center h-8 text-sm"
                      value={getValue(rate, "pac_days") as string}
                      onChange={e => updateField(rate.id, "pac_days", e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Input
                      type="number"
                      step="0.10"
                      className="w-24 mx-auto text-center h-8 text-sm"
                      value={getValue(rate, "sedex_price") as number}
                      onChange={e => updateField(rate.id, "sedex_price", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Input
                      className="w-20 mx-auto text-center h-8 text-sm"
                      value={getValue(rate, "sedex_days") as string}
                      onChange={e => updateField(rate.id, "sedex_days", e.target.value)}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => updateField(rate.id, "is_active", !(getValue(rate, "is_active") as boolean))}>
                      <Badge variant={(getValue(rate, "is_active") as boolean) ? "default" : "secondary"}>
                        {(getValue(rate, "is_active") as boolean) ? "Ativo" : "Inativo"}
                      </Badge>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShippingManagement;
