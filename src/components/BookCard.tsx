import type { Book } from '../types';

interface Props {
  book: Book;
  action: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'accent';
    disabled?: boolean;
  };
  badge?: string;
}

export default function BookCard({ book, action, badge }: Props) {
  const variantClass = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800',
    secondary: 'bg-stone-200 text-stone-800 hover:bg-stone-300',
    accent: 'bg-amber-500 text-white hover:bg-amber-600',
  }[action.variant ?? 'primary'];

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-stone-300 transition-colors">
      <div className="relative bg-stone-100 h-52 flex-shrink-0">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-300 px-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs text-center leading-snug">{book.title}</span>
          </div>
        )}
        {badge && (
          <span className="absolute top-2 right-2 text-xs font-semibold bg-teal-700 text-white px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-semibold text-stone-900 leading-snug line-clamp-2">{book.title}</h3>
          <p className="text-sm text-stone-500 mt-0.5 truncate">{book.author}</p>
          {book.firstPublished && (
            <p className="text-xs text-stone-400 mt-0.5">{book.firstPublished}</p>
          )}
        </div>

        <div className="mt-auto">
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClass}`}
          >
            {action.label}
          </button>
        </div>
      </div>
    </div>
  );
}
