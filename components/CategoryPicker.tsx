import { useState, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface CategoryPickerProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  className?: string;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategory,
  onSelect,
  className = "",
}) => {
  const [lastUsedCategory, setLastUsedCategory] = useLocalStorage<string>(
    "lastUsedCategory",
    ""
  );

  // Set the initial selection when component mounts (for new transactions)
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      let initialCat = lastUsedCategory;

      // If last used category is not in the current list or empty, use the first category
      if (!initialCat || !categories.includes(initialCat)) {
        initialCat = categories[0];
      }

      onSelect(initialCat);
    }
  }, [categories, lastUsedCategory, onSelect, selectedCategory]);

  const handleCategoryClick = useCallback(
    (category: string) => {
      onSelect(category);
      setLastUsedCategory(category);
    },
    [onSelect, setLastUsedCategory]
  );

  // Check if categories take up more than 15% of the screen height
  const needsScroll = categories.length > 6; // Approximate threshold

  return (
    <div className={className}>
      <div className="d-flex flex-column gap-2">
        <label
          className="form-label mb-0"
          style={{ color: "var(--foreground)", fontWeight: 500 }}
        >
          Categoria
        </label>
        <div
          className="d-flex flex-wrap gap-2 p-2 rounded"
          style={{
            maxHeight: needsScroll ? "15vh" : "none",
            overflowY: needsScroll ? "auto" : "visible",
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--border-color)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderRadius: "0.5rem",
          }}
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "primary" : "outline-secondary"}
              size="sm"
              onClick={() => handleCategoryClick(category)}
              className={`rounded-pill px-3 transition-all flex-grow-0`}
              style={{
                fontSize: '0.875rem',
                fontWeight: selectedCategory === category ? '600' : '400',
                opacity: selectedCategory === category ? '1' : '0.6',
                backgroundColor: selectedCategory === category
                  ? 'var(--primary)'
                  : 'transparent',
                borderColor: selectedCategory === category
                  ? 'var(--primary)'
                  : 'var(--border-color)',
                color: selectedCategory === category
                  ? 'white'
                  : 'var(--foreground)',
                transform: selectedCategory === category ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s ease',
                flex: '0 0 auto',
              }}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};