import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LANGS: { key: Lang; label: string }[] = [
  { key: "tr", label: "TR" },
  { key: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center rounded-lg border bg-card p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.key}
          onClick={() => setLang(l.key)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
            lang === l.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
