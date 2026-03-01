interface CategoryBadgeProps {
  category: string;
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="inline-block bg-stealth-grey border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded mr-2 mb-2 hover:border-arena-red hover:text-white transition-colors cursor-default">
      {category}
    </span>
  );
}
