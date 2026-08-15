type RecentSearchesProps = {
  terms: string[];
  onSelect: (term: string) => void;
};

export function RecentSearches({ terms, onSelect }: RecentSearchesProps) {
  if (terms.length === 0) {
    return null;
  }

  return (
    <section>
      <p className="text-12 tracking-label text-taupe">Son Aramalar</p>
      <ul className="mt-4 flex flex-col gap-3">
        {terms.map((term) => (
          <li key={term}>
            <button
              type="button"
              onClick={() => onSelect(term)}
              className="text-left text-16 text-charcoal transition-colors hover:text-black"
            >
              {term}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
