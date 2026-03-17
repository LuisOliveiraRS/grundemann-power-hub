import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, ShoppingCart, Package, Wrench, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DiagnosticProblem, DiagnosticCause, DiagnosticProductTag } from "@/pages/GeneratorDiagnostic";

interface Props {
  problem: DiagnosticProblem;
  causes: DiagnosticCause[];
  tags: DiagnosticProductTag[];
  products: any[];
  loadingProducts: boolean;
  iconMap: Record<string, React.ElementType>;
  onReset: () => void;
}

const DiagnosticResults = ({ problem, causes, tags, products, loadingProducts, iconMap, onReset }: Props) => {
  const Icon = iconMap[problem.icon_name] || iconMap.AlertTriangle;

  const whatsappMessage = encodeURIComponent(
    `Olá! Meu gerador apresenta o seguinte problema: *${problem.name}*. Preciso de ajuda para identificar as peças necessárias.`
  );

  return (
    <div>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos problemas
      </button>

      {/* Problem Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent rounded-2xl border border-destructive/20 p-6 md:p-8 mb-8"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-destructive/15 p-3 flex-shrink-0">
            <Icon className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-black text-foreground">
              {problem.name}
            </h2>
            <p className="text-muted-foreground mt-1">{problem.description}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Causes */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6 sticky top-4"
          >
            <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-accent" />
              Possíveis Causas
            </h3>
            <ol className="space-y-3">
              {causes.map((cause, i) => (
                <motion.li
                  key={cause.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground leading-relaxed">{cause.cause_text}</span>
                </motion.li>
              ))}
            </ol>

            {/* Search Tags */}
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Peças relacionadas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.search_tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/5551981825748?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#22c55e] transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              Falar com Especialista
            </a>
          </motion.div>
        </div>

        {/* Right: Recommended Products */}
        <div className="lg:col-span-2">
          <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2 mb-4">
            <Wrench className="h-5 w-5 text-primary" />
            Produtos Recomendados
          </h3>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-border">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum produto encontrado para este problema.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Entre em contato conosco para ajuda personalizada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                >
                  <Link
                    to={`/produto/${product.slug || product.id}`}
                    className="group flex gap-4 bg-card rounded-xl border border-border p-4 hover:border-primary/40 hover:shadow-lg transition-all"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-20 rounded-lg object-cover border border-border flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {product.brand && (
                          <span className="text-xs text-muted-foreground">{product.brand}</span>
                        )}
                        {product.hp && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {product.hp}HP
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            R$ {Number(product.original_price).toFixed(2).replace(".", ",")}
                          </span>
                        )}
                        <span className="text-base font-black text-primary">
                          R$ {Number(product.price).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      {product.stock_quantity > 0 ? (
                        <span className="text-[10px] text-green-600 font-medium">Em estoque</span>
                      ) : (
                        <span className="text-[10px] text-destructive font-medium">Indisponível</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA to all products */}
          <div className="mt-8 text-center">
            <Link to={`/produtos?busca=${encodeURIComponent(problem.name)}`}>
              <Button variant="outline" size="lg" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Ver todos os produtos relacionados
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticResults;
