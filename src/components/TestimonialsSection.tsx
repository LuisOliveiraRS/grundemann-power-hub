import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  id: string;
  customer_name: string;
  customer_city: string;
  rating: number;
  comment: string;
}

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setTestimonials(data as Testimonial[]);
      });
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <h2 className="font-heading text-2xl font-extrabold text-foreground text-center mb-2 uppercase tracking-wide">
          Depoimentos de Clientes
        </h2>
        <p className="text-center text-muted-foreground mb-8">Veja o que nossos clientes dizem sobre nós</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow relative"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < t.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-card-foreground leading-relaxed mb-4">"{t.comment}"</p>
              <div className="border-t border-border pt-3">
                <p className="font-heading font-bold text-sm text-card-foreground">{t.customer_name}</p>
                {t.customer_city && (
                  <p className="text-xs text-muted-foreground">{t.customer_city}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
