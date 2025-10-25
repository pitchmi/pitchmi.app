// components/ErrorBoundary.tsx
import React from "react";
import { View, Text } from "react-native";
import { logger } from "@/lib/logger";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Log centralizado (luego puedes enchufar Sentry aquí)
    logger.error("ErrorBoundary", { error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Algo ha fallado</Text>
          <Text style={{ textAlign: "center", opacity: 0.7 }}>
            Vuelve atrás e inténtalo de nuevo.
          </Text>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

