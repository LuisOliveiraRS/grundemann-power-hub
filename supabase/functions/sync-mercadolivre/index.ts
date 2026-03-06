const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ScrapedProduct {
  title: string;
  price: number;
  image_url: string;
  ml_link: string;
  free_shipping: boolean;
  subcategory?: string;
}

function parseProducts(html: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  const productPattern = /class="[^"]*poly-card[^"]*"[\s\S]*?<a[^>]*href="(https:\/\/[^"]*mercadolivre[^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[\s\S]*?<span[^>]*class="[^"]*andes-money-amount__fraction[^"]*"[^>]*>([^<]*)<\/span>/gi;

  let match;
  while ((match = productPattern.exec(html)) !== null) {
    const link = match[1];
    const image = match[2];
    const title = match[3];
    const priceStr = match[4].replace(/\./g, '').replace(',', '.');
    const price = parseFloat(priceStr) || 0;

    if (title && price > 0 && !products.some(p => p.title === title)) {
      const subcategory = inferSubcategory(title);
      products.push({ title, price, image_url: image, ml_link: link.split('#')[0].split('?')[0], free_shipping: true, subcategory });
    }
  }

  if (products.length === 0) {
    const linkPattern = /\[([^\]]+)\]\((https:\/\/[^)]*mercadolivre[^)]*)\)/g;
    const pricePattern = /R\$\s*([\d.,]+)/g;
    const imgPattern = /!\[[^\]]*\]\((https:\/\/[^)]*mlstatic[^)]*)\)/g;

    const titles: { title: string; link: string }[] = [];
    const prices: number[] = [];
    const images: string[] = [];

    let m;
    while ((m = linkPattern.exec(html)) !== null) {
      const title = m[1]; const link = m[2];
      if (title.length > 10 && !title.includes('Ver mais') && !title.includes('Ir para') && !title.includes('Denunciar') && (link.includes('/p/MLB') || link.includes('MLB-'))) {
        titles.push({ title, link: link.split('#')[0].split('?')[0] });
      }
    }
    while ((m = pricePattern.exec(html)) !== null) { prices.push(parseFloat(m[1].replace(/\./g, '').replace(',', '.')) || 0); }
    while ((m = imgPattern.exec(html)) !== null) { if (!m[1].includes('Base64')) images.push(m[1]); }

    for (let i = 0; i < titles.length && i < prices.length; i++) {
      if (!products.some(p => p.title === titles[i].title)) {
        const subcategory = inferSubcategory(titles[i].title);
        products.push({ title: titles[i].title, price: prices[i], image_url: images[i] || '', ml_link: titles[i].link, free_shipping: true, subcategory });
      }
    }
  }

  return products;
}

function inferSubcategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('filtro')) return 'Filtros';
  if (t.includes('carburador')) return 'Carburadores';
  if (t.includes('pistão') || t.includes('pistao')) return 'Pistões';
  if (t.includes('bobina') || t.includes('ignição') || t.includes('ignicao')) return 'Ignição';
  if (t.includes('válvula') || t.includes('valvula')) return 'Válvulas';
  if (t.includes('junta') || t.includes('vedação') || t.includes('vedacao')) return 'Juntas e Vedações';
  if (t.includes('rotor') || t.includes('estator') || t.includes('avr')) return 'Componentes Elétricos';
  if (t.includes('gerador')) return 'Geradores';
  if (t.includes('motor')) return 'Motores';
  return 'Peças Gerais';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claims.claims.sub as string;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Fetching Mercado Livre store page...');
    const mlResponse = await fetch('https://www.mercadolivre.com.br/pagina/grundemann', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });

    if (!mlResponse.ok) throw new Error(`Failed to fetch ML page: ${mlResponse.status}`);

    const html = await mlResponse.text();
    console.log('Page fetched, parsing products...');

    const scrapedProducts = parseProducts(html);
    console.log(`Found ${scrapedProducts.length} products`);

    if (scrapedProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true, products: [], synced: 0,
        message: 'Não foi possível extrair produtos automaticamente. Use a sincronização manual.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get or create a parent category for ML products - "Peças e Componentes"
    const parentCategoryName = 'Peças e Componentes';
    const parentSlug = 'pecas-e-componentes';
    let parentCategoryId: string;

    const { data: existingParent } = await supabaseAdmin.from('categories').select('id').eq('slug', parentSlug).maybeSingle();
    if (existingParent) {
      parentCategoryId = existingParent.id;
    } else {
      const { data: newParent } = await supabaseAdmin.from('categories').insert({ name: parentCategoryName, slug: parentSlug, description: 'Peças e componentes importados do Mercado Livre' }).select('id').single();
      if (!newParent) throw new Error('Failed to create parent category');
      parentCategoryId = newParent.id;
    }

    // Get existing subcategories for this parent
    const { data: existingSubs } = await supabaseAdmin.from('subcategories').select('id, name, slug').eq('category_id', parentCategoryId);
    const subMap = new Map<string, string>();
    for (const s of (existingSubs || [])) subMap.set(s.name.toLowerCase(), s.id);

    // Create missing subcategories
    const uniqueSubcats = [...new Set(scrapedProducts.map(p => p.subcategory).filter(Boolean))] as string[];
    let subsCreated = 0;
    for (const subName of uniqueSubcats) {
      if (!subMap.has(subName.toLowerCase())) {
        const slug = subName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const { data: newSub } = await supabaseAdmin.from('subcategories').insert({
          name: subName, slug, category_id: parentCategoryId,
          description: `Subcategoria importada do Mercado Livre`,
        }).select('id').single();
        if (newSub) {
          subMap.set(subName.toLowerCase(), newSub.id);
          subsCreated++;
        }
      }
    }

    let synced = 0, created = 0, updated = 0;

    for (const sp of scrapedProducts) {
      const subcategoryId = sp.subcategory ? (subMap.get(sp.subcategory.toLowerCase()) || null) : null;

      const { data: existing } = await supabaseAdmin.from('products').select('id, name, price').ilike('name', `%${sp.title.substring(0, 30)}%`).limit(1).maybeSingle();

      if (existing) {
        const updateData: any = { category_id: parentCategoryId, subcategory_id: subcategoryId };
        if (Math.abs(existing.price - sp.price) > 0.01) updateData.price = sp.price;
        if (sp.image_url) updateData.image_url = sp.image_url;
        await supabaseAdmin.from('products').update(updateData).eq('id', existing.id);
        updated++;
      } else {
        await supabaseAdmin.from('products').insert({
          name: sp.title, price: sp.price, image_url: sp.image_url,
          description: `Produto importado do Mercado Livre. Link: ${sp.ml_link}`,
          is_active: true, stock_quantity: 10,
          category_id: parentCategoryId,
          subcategory_id: subcategoryId,
        });
        created++;
      }
      synced++;
    }

    return new Response(JSON.stringify({
      success: true, products: scrapedProducts, synced, created, updated,
      message: `Sincronização concluída: ${created} novos, ${updated} atualizados, ${subsCreated} subcategorias criadas de ${scrapedProducts.length} produtos encontrados.`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error syncing:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
