import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  icon: string;
  image_url: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface MenuCategoryNode extends MenuCategory {
  children: MenuCategoryNode[];
  depth: number;
  fullPath: string;
}

const buildTree = (items: MenuCategory[], parentId: string | null = null, depth = 0, parentPath = ""): MenuCategoryNode[] => {
  return items
    .filter(i => i.parent_id === parentId && i.is_active)
    .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name))
    .map(item => {
      const fullPath = parentPath ? `${parentPath}/${item.slug}` : item.slug;
      return {
        ...item,
        depth,
        fullPath,
        children: buildTree(items, item.id, depth + 1, fullPath),
      };
    });
};

const buildTreeAll = (items: MenuCategory[], parentId: string | null = null, depth = 0, parentPath = ""): MenuCategoryNode[] => {
  return items
    .filter(i => i.parent_id === parentId)
    .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name))
    .map(item => {
      const fullPath = parentPath ? `${parentPath}/${item.slug}` : item.slug;
      return {
        ...item,
        depth,
        fullPath,
        children: buildTreeAll(items, item.id, depth + 1, fullPath),
      };
    });
};

export const useMenuCategories = (includeInactive = false) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tree, setTree] = useState<MenuCategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const query = supabase.from("menu_categories").select("*").order("display_order").order("name");
    const { data } = await query;
    const items = (data || []) as MenuCategory[];
    setCategories(items);
    setTree(includeInactive ? buildTreeAll(items) : buildTree(items));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reload = () => load();

  const findBySlugPath = (slugPath: string): MenuCategoryNode | null => {
    const slugs = slugPath.split("/").filter(Boolean);
    let nodes = tree;
    let found: MenuCategoryNode | null = null;
    for (const slug of slugs) {
      const node = nodes.find(n => n.slug === slug);
      if (!node) return null;
      found = node;
      nodes = node.children;
    }
    return found;
  };

  const getAncestors = (id: string): MenuCategory[] => {
    const ancestors: MenuCategory[] = [];
    let current = categories.find(c => c.id === id);
    while (current?.parent_id) {
      const parent = categories.find(c => c.id === current!.parent_id);
      if (parent) { ancestors.unshift(parent); current = parent; }
      else break;
    }
    return ancestors;
  };

  const getAllDescendantIds = (id: string): string[] => {
    const ids: string[] = [id];
    const children = categories.filter(c => c.parent_id === id);
    children.forEach(child => ids.push(...getAllDescendantIds(child.id)));
    return ids;
  };

  return { categories, tree, loading, reload, findBySlugPath, getAncestors, getAllDescendantIds };
};

export { buildTree, buildTreeAll };
