import { Component, ReactNode, ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 p-8">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="font-heading text-xl font-bold text-foreground">Algo deu errado</h2>
          <p className="text-muted-foreground text-sm text-center max-w-md">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <Button onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
