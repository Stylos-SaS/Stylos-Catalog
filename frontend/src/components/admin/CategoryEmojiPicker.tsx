import { CATEGORY_EMOJI_OPTIONS } from "@/lib/category-emojis";
import { cn } from "@/lib/utils";

type CategoryEmojiPickerProps = {
  value: string;
  onChange: (emoji: string) => void;
};

export function CategoryEmojiPicker({ value, onChange }: CategoryEmojiPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_EMOJI_OPTIONS.map((emoji) => {
        const selected = value === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl border text-xl transition",
              selected
                ? "border-primary bg-primary/10 shadow-soft"
                : "border-border bg-background hover:bg-secondary",
            )}
            aria-label={`Emoji ${emoji}`}
            aria-pressed={selected}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
