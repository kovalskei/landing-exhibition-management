
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import Index from "./pages/Index";
import MobileProgram from "./pages/MobileProgram";
import WebProgram from "./pages/WebProgram";
import ProgramSettings from "./pages/ProgramSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProgramRouter() {
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  
  console.log('🔄 ProgramRouter: Full URL:', window.location.href);
  console.log('🔄 ProgramRouter: Hash:', window.location.hash);
  
  // Определяем, мобильное ли устройство
  const isMobile = 
    window.innerWidth <= 900 || 
    /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(navigator.userAgent || '');
  
  // Если параметр view указан явно, используем его
  if (viewParam === 'mobile') {
    return <MobileProgram />;
  }
  
  if (viewParam === 'web') {
    return <WebProgram />;
  }
  
  // Автоопределение без редиректа
  return isMobile ? <MobileProgram /> : <WebProgram />;
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
          <Route path="/program/settings" element={<ProgramSettings />} />
          <Route path="/home-page-2" element={<ProgramRouter />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<ProgramRouter />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;