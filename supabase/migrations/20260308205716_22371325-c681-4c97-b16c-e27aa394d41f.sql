
-- Table for technical articles / blog posts
CREATE TABLE public.technical_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Manutenção',
  tags TEXT[] NOT NULL DEFAULT '{}',
  read_time TEXT NOT NULL DEFAULT '5 min',
  is_published BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.technical_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
CREATE POLICY "Anyone can view published articles"
ON public.technical_articles FOR SELECT
USING (is_published = true OR public.is_admin());

-- Admins can manage
CREATE POLICY "Admins can manage articles"
ON public.technical_articles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Insert initial articles
INSERT INTO public.technical_articles (title, slug, excerpt, content, category, tags, read_time, is_published) VALUES
('Como Regular o Carburador de Motor Estacionário', 'como-regular-carburador-motor-estacionario', 'Guia completo para regulagem do carburador em motores estacionários a gasolina de 5HP a 15HP.', '## Por que regular o carburador?

O carburador é responsável pela mistura ar-combustível que alimenta o motor. Uma regulagem incorreta pode causar:

- **Consumo excessivo** de combustível
- **Perda de potência** do motor
- **Motor falhando** ou morrendo
- **Fumaça preta** no escapamento

## Ferramentas Necessárias

- Chave de fenda pequena
- Conta-giros (opcional)
- Limpa carburador em spray
- Pano limpo

## Passo a Passo

### 1. Aqueça o Motor
Ligue o motor e deixe funcionando por 3-5 minutos até atingir a temperatura de trabalho.

### 2. Localize os Parafusos de Regulagem
- **Parafuso de mistura**: controla a proporção ar/combustível
- **Parafuso de marcha lenta**: controla a rotação em marcha lenta

### 3. Regule a Mistura
1. Gire totalmente no sentido horário (fechado)
2. Abra 1,5 volta como ponto de partida
3. Ajuste até o motor funcionar suave e estável

### 4. Teste Final
Acelere e desacelere algumas vezes. O motor deve responder sem engasgar.', 'Manutenção', ARRAY['carburador', 'regulagem', 'motor estacionário'], '8 min', true),

('Como Trocar o Filtro de Ar do Motor Estacionário', 'como-trocar-filtro-de-ar-motor-estacionario', 'Aprenda quando e como trocar o filtro de ar do seu motor estacionário.', '## Importância do Filtro de Ar

O filtro de ar protege o motor contra partículas de poeira e detritos.

## Quando Trocar?

- **A cada 50 horas** em condições normais
- **A cada 25 horas** em ambientes com muita poeira
- Quando visivelmente sujo ou danificado

## Tipos de Filtro

### Filtro de Espuma
- Comum em motores 5HP-7HP
- Pode ser lavado e reutilizado

### Filtro de Papel
- Comum em motores 10HP-15HP
- NÃO pode ser lavado

## Passo a Passo

1. Desligue o motor e aguarde esfriar
2. Remova a tampa do filtro de ar
3. Retire o filtro usado
4. Limpe o compartimento
5. Instale o filtro novo
6. Recoloque a tampa', 'Manutenção', ARRAY['filtro de ar', 'troca', 'manutenção preventiva'], '5 min', true),

('Motor Estacionário Não Liga: Diagnóstico Completo', 'diagnostico-motor-estacionario-nao-liga', 'Seu motor estacionário não liga? Veja as principais causas e soluções.', '## Checklist Rápido

1. Há combustível no tanque?
2. O registro está aberto?
3. O interruptor está na posição ON?
4. O afogador está correto?

## Causas Mais Comuns

### 1. Problema na Vela de Ignição
Remova a vela e verifique se há faísca. Gap ideal: 0,6-0,7mm.

### 2. Combustível Velho
Drene combustível com mais de 30 dias e abasteça com gasolina fresca.

### 3. Filtro de Ar Entupido
Remova e inspecione. Limpe ou substitua.

### 4. Carburador Entupido
Verifique se há combustível chegando. Limpe os giclês.

### 5. Bobina de Ignição Defeituosa
Teste com multímetro e substitua se necessário.', 'Diagnóstico', ARRAY['diagnóstico', 'motor não liga', 'solução de problemas'], '10 min', true),

('Motor Falhando: Causas e Soluções', 'motor-falhando-causas-solucoes', 'Motor falhando, engasgando ou com funcionamento irregular? Descubra as causas.', '## Tipos de Falha

### Falha Constante
Regular e previsível. Indica problema em componente específico.

### Falha Intermitente
Sem padrão. Mais difícil de diagnosticar.

### Falha Sob Carga
Funciona em marcha lenta mas falha quando exigido.

## Causas e Soluções

### 1. Vela com Defeito
Faísca fraca. Troque por uma nova do modelo correto.

### 2. Carburador Desregulado
Mistura rica ou pobre. Regule o parafuso de mistura.

### 3. Ar no Sistema de Combustível
Verifique e substitua mangueiras danificadas.

### 4. Governador Desajustado
Ajuste conforme manual do fabricante.', 'Diagnóstico', ARRAY['motor falhando', 'diagnóstico', 'reparo'], '7 min', true),

('Guia de Manutenção Preventiva para Motores Estacionários', 'manutencao-preventiva-motores-estacionarios', 'Cronograma completo de manutenção preventiva para motores de 5HP a 15HP.', '## Por que Fazer Manutenção Preventiva?

- Dobrar a vida útil do motor
- Reduzir custos com reparos
- Manter a performance original

## Cronograma

### Antes de Cada Uso
- Verificar nível de óleo
- Verificar nível de combustível
- Inspecionar vazamentos

### A Cada 25 Horas
- Limpar filtro de ar
- Verificar vela de ignição

### A Cada 50 Horas
- Trocar óleo do motor
- Trocar filtro de ar (papel)
- Limpar tanque de combustível

### A Cada 100 Horas
- Trocar vela de ignição
- Verificar/ajustar válvulas
- Limpar carburador

### A Cada 300 Horas
- Trocar filtro de combustível
- Verificar compressão', 'Manutenção', ARRAY['manutenção preventiva', 'cronograma', 'vida útil'], '12 min', true);
