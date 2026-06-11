import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { appRoutes } from "@/routes";
import { AppToaster } from "@/shared/components/feedback/AppToaster";

const queryClient = new QueryClient();

/**
 * Renders the matched route tree. Must live inside <Router> so that
 * useRoutes() has access to the routing context.
 */
function AppRoutes() {
  return useRoutes(appRoutes);
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
        <AppToaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
