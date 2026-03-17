import { motion } from "framer-motion";
import type { DiagnosticProblem } from "@/pages/GeneratorDiagnostic";

interface Props {
  problems: DiagnosticProblem[];
  loading: boolean;
  iconMap: Record<string, React.ElementType>;
  onSelect: (problem: DiagnosticProblem) => void;
}

const DiagnosticProblemSelector = ({ problems, loading, iconMap, onSelect }: Props) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">
        Qual problema seu gerador apresenta?
      </h2>
      <p className="text-muted-foreground text-center mb-8">
        Clique no problema para ver causas prováveis e peças recomendadas
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {problems.map((problem, i) => {
          const Icon = iconMap[problem.icon_name] || iconMap.AlertTriangle;
          return (
            <motion.button
              key={problem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => onSelect(problem)}
              className="group relative text-left rounded-2xl border-2 border-border bg-card p-6 hover:border-primary hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent -translate-y-6 translate-x-6 group-hover:from-primary/10 transition-colors" />
              <div className="inline-flex items-center justify-center rounded-xl bg-destructive/10 p-3 mb-4 group-hover:bg-primary/15 transition-colors">
                <Icon className="h-7 w-7 text-destructive group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-heading font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {problem.name}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {problem.description}
              </p>
              <div className="mt-4 inline-flex items-center text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Diagnosticar →
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default DiagnosticProblemSelector;
