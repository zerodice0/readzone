import { type KeyboardEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounced } from '@/hooks/useDebounced';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4001';

interface Props {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagInput({ tags, onTagsChange }: Props) {
  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState<number>(-1);

  const addTag = (t: string) => {
    const v = t.trim().replace(/^#/, '');

    if (!v) {
      return;
    }
    if (tags.includes(v) || tags.length >= 10) {
      return;
    }
    onTagsChange([...tags, v]);
    setTagInput('');
    setShowSuggestions(false);
  };

  const removeTag = (t: string) => onTagsChange(tags.filter((x) => x !== t));

  // Fetch tag suggestions (debounced)
  useDebounced(
    () => {
      const q = tagInput.trim().replace(/^#/, '');

      if (!q) {
        setSuggestions([]);
        setActiveSuggestIndex(-1);

        return;
      }

      (async () => {
        try {
          const url = new URL(`${API_BASE_URL}/api/tags/suggestions`);

          url.searchParams.set('query', q);
          url.searchParams.set('limit', '5');
          const res = await fetch(url.toString(), { credentials: 'include' });

          if (!res.ok) {
            return;
          }
          const data = await res.json();
          const s: { name: string; count: number }[] =
            data?.data?.suggestions ?? [];
          const list = s
            .map((x) => x.name)
            .filter((name) => !tags.includes(name));

          setSuggestions(list);
          setShowSuggestions(list.length > 0);
          setActiveSuggestIndex(list.length > 0 ? 0 : -1);
        } catch {
          // ignore
        }
      })();
    },
    300,
    [tagInput]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestIndex((i) => (i + 1) % suggestions.length);

        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length
        );

        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (
          activeSuggestIndex >= 0 &&
          activeSuggestIndex < suggestions.length
        ) {
          const suggestion = suggestions[activeSuggestIndex];

          if (suggestion) {
            addTag(suggestion);
          }
        } else {
          addTag(tagInput);
        }

        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setActiveSuggestIndex(-1);

        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">태그</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="px-2 py-1 text-xs border rounded-full">
            #{t}
            <button
              className="ml-1 text-muted-foreground"
              onClick={() => removeTag(t)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => {
            setTagInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            tags.length < 10 ? '태그 입력 후 Enter (최대 10개)' : '최대 도달'
          }
          disabled={tags.length >= 10}
        />
        <Button
          variant="secondary"
          onClick={() => addTag(tagInput)}
          disabled={!tagInput.trim() || tags.length >= 10}
        >
          추가
        </Button>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 top-full left-0 mt-1 w-full bg-white border rounded shadow">
            {suggestions.map((s, idx) => (
              <button
                key={s}
                className={`block w-full text-left px-3 py-2 hover:bg-gray-100 ${idx === activeSuggestIndex ? 'bg-gray-100' : ''}`}
                onMouseEnter={() => setActiveSuggestIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => addTag(s)}
              >
                #{s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
