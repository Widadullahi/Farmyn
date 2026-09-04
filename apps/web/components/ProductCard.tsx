"use client";
import { MapPin, ShieldCheck, ShoppingCart, Star, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Product, formatNaira } from "@/lib/app-data";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md bg-foreground/75 px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
            {product.category}
          </span>
          {product.sellerVerified && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
              <ShieldCheck className="h-3 w-3" />
              Verified Seller
            </span>
          )}
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/50 backdrop-blur-sm">
            <span className="rounded-md bg-card px-4 py-1.5 text-sm font-semibold text-foreground shadow-elevated">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 fill-secondary text-secondary" />
            {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {product.location}
          </span>
        </div>
        <h3 className="text-sm font-semibold leading-snug text-card-foreground">{product.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{product.sellerName}</p>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div>
            <p className="font-display text-lg font-bold text-primary">{formatNaira(product.price)}</p>
            <p className="text-[11px] text-muted-foreground">
              {product.unit} • MOQ {product.minimumOrder}
            </p>
          </div>
          <div className="flex gap-1.5">
            <Link href={`/chat?user=${product.sellerId}`}>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 hover:bg-accent/40"
                title="Message Seller"
              >
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              </Button>
            </Link>
            <Button
              size="sm"
              disabled={!product.inStock}
              className="h-8 gap-1.5 text-xs"
              onClick={() => onAddToCart?.(product.id)}
            >
              <ShoppingCart className="h-3 w-3" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
