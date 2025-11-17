'use client';

interface JobFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onReset: () => void;
  disabled?: boolean;
}

export default function JobFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  onReset,
  disabled = false,
}: JobFilterProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-6 lg:items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={disabled}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="h-12 px-6 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
