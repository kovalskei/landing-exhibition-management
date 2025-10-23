
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import Index from "./pages/Index";
import MobileProgram from "./pages/MobileProgram";
import WebProgram from "./pages/WebProgram";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProgramRouter() {
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  
  // Если view=mobile, показываем мобильную версию
  if (viewParam === 'mobile') {
    return <MobileProgram />;
  }
  
  // Если view=web, показываем веб версию
  if (viewParam === 'web') {
    return <WebProgram />;
  }
  
  // Автоопределение: мобильные устройства → mobile, остальные → web
  const isMobile = 
    window.innerWidth <= 900 || 
    /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(navigator.userAgent || '');
  
  return <Navigate to={`/program?view=${isMobile ? 'mobile' : 'web'}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/program" element={<ProgramRouter />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;