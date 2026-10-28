import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/layout/CartDrawer';
import { QuickViewModal } from './components/products/QuickViewModal';
import { CompareDrawer } from './components/products/CompareDrawer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AccountPage } from './pages/AccountPage';
import { AuthPage } from './pages/AuthPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ServicesPage } from './pages/ServicesPage';
import { VideosPage } from './pages/VideosPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application Error Boundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#111312] text-stone-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#1B1D1C] border border-red-500/30 rounded-2xl p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h1 className="font-display text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-xs text-stone-400 font-mono break-all mb-5">
              {this.state.errorMessage}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.href = '/';
              }}
              className="px-5 py-2.5 rounded-xl bg-[#FF8618] text-white text-xs font-semibold"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-5 sm:right-5 z-50 flex flex-col gap-2 sm:max-w-sm sm:w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white dark:bg-[#1B1D1C] border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-[#FF8618] shrink-0" />}
            <span className="break-words">{t.message}</span>
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <StoreProvider>
            <BrowserRouter>
              <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-[#F7F7F5] dark:bg-[#111312] text-stone-900 dark:text-stone-100 transition-colors duration-200">
                <Navbar />
                <main className="flex-1 w-full">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/videos" element={<VideosPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/product/:slug" element={<ProductDetailPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/admin-login" element={<AdminLoginPage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
                <Footer />
                <CartDrawer />
                <QuickViewModal />
                <CompareDrawer />
                <ToastContainer />
              </div>
            </BrowserRouter>
          </StoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
