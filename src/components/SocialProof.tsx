import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Package, Clock, Award } from "lucide-react";

interface Stat {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { icon: Users, value: 85, suffix: "+", label: "Mecânicos Atendidos" },
  { icon: Package, value: 3000, suffix: "+", label: "Peças Vendidas" },
  { icon: Clock, value: 10, suffix: "", label: "Anos de Experiência" },
  { icon: Award, value: 100, suffix: "%", label: "Satisfação Garantida" },
];

const AnimatedCounter = ({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span className="font-heading text-4xl md:text-5xl font-black text-primary-foreground">
      {count.toLocaleString("pt-BR")}{suffix}
    </span>
  );
};

const SocialProof = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-16 bg-gradient-to-r from-primary via-primary to-secondary overflow-hidden">
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-primary-foreground uppercase tracking-wide">
            Números que comprovam nossa qualidade
          </h2>
          <p className="text-primary-foreground/70 mt-2">Referência em motores estacionários no Brasil</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center p-6 rounded-xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10"
            >
              <stat.icon className="h-8 w-8 text-accent mx-auto mb-3" />
              <AnimatedCounter target={stat.value} suffix={stat.suffix} inView={isInView} />
              <p className="text-primary-foreground/80 text-sm font-medium mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
