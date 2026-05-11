import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router';
import { PrimeReactProvider } from 'primereact/api';
import './index.css'
import Layout from './layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/admin_page/CreateAccountPage'
import { Toaster } from 'react-hot-toast';
import { RoleProvider } from './provider/RoleProvider';
import HomeRouter from './router/HomeRouter';
import ClassificationPage from './pages/doctor_page/ClassificationPage';
import RoleRequired from './router/RoleRequired';
import PublicRoute from './router/PublicRoute';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomeRouter /> },
      { path: "classification", element: <RoleRequired expectedRole='doctor'><ClassificationPage /></RoleRequired> },
      { path: "create-account", element: <RoleRequired expectedRole='admin'><CreateAccountPage /></RoleRequired> }
    ],
  },
  {
    path: "/register",
    element: <PublicRoute><RegisterPage /></PublicRoute>
  },
  {
    path: "/login",
    element: <PublicRoute><LoginPage /></PublicRoute>
  }
]);

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider value={{ unstyled: false }}>
        <div><Toaster /></div>
        <RoleProvider>
          <RouterProvider router={router} />
        </RoleProvider>
      </PrimeReactProvider>
    </QueryClientProvider>
  </StrictMode>,
)
