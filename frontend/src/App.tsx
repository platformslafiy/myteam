import { ThemeProvider } from "./components/theme-provider";
import { ToastProvider } from "./components/ui/toast";
import { I18nProvider } from "./lib/i18n";
import { TimelinePage } from "./components/TimelinePage";

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <TimelinePage />
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
