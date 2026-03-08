import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  count: number;
  href: string;
}

const CategoryCard = ({ name, icon: Icon, count, href }: CategoryCardProps) => {
  return (
    <Link to={href}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 shadow-card transition-colors duration-300 hover:border-primary/30 hover:bg-accent/50"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent transition-all duration-300 group-hover:bg-primary group-hover:shadow-lg">
          <Icon className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-card-foreground">{name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{count} products</p>
        </div>
      </motion.div>
    </Link>
  );
};

export default CategoryCard;
