import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridSkeletonProps {
  count?: number;
}

const ProductCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-card overflow-hidden">
    <div className="aspect-square bg-muted">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
    <div className="p-4 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-6 w-1/2 mt-2" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-10 w-full mt-3 rounded-md" />
    </div>
  </div>
);

const ProductGridSkeleton = ({ count = 4 }: ProductGridSkeletonProps) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

const ProductDetailSkeleton = () => (
  <div className="container py-8">
    <Skeleton className="h-4 w-64 mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="flex gap-2 mt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-16 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-3 mt-6">
          <Skeleton className="h-12 w-32 rounded-md" />
          <Skeleton className="h-12 flex-1 rounded-md" />
        </div>
        <Skeleton className="h-20 w-full mt-4 rounded-lg" />
      </div>
    </div>
  </div>
);

export { ProductCardSkeleton, ProductGridSkeleton, ProductDetailSkeleton };
export default ProductGridSkeleton;
