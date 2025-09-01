/**
 * All route definitions
 */

export interface RouteConfig {
  path: string;
  name: string;
  component: string;
  protected: boolean;
  adminOnly: boolean;
  hidden: boolean;
  description: string;
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    name: 'Home',
    component: 'HomePage',
    protected: false,
    adminOnly: false,
    hidden: false,
    description: 'Landing page with products overview'
  },
  {
    path: '/products',
    name: 'Products',
    component: 'ProductsPage',
    protected: false,
    adminOnly: false,
    hidden: false,
    description: 'Browse and manage products'
  },
  {
    path: '/login',
    name: 'Login',
    component: 'LoginPage',
    protected: false,
    adminOnly: false,
    hidden: true,
    description: 'User authentication'
  },
  {
    path: '/admin',
    name: 'Admin',
    component: 'AdminPage',
    protected: true,
    adminOnly: true,
    hidden: false,
    description: 'Administrative dashboard and controls'
  },
  {
    path: '/status',
    name: 'Status',
    component: 'StatusPage',
    protected: false,
    adminOnly: false,
    hidden: true,
    description: 'Database and system health status'
  }
];

// Helper functions for route management
export const getPublicRoutes = () => routes.filter(route => !route.protected && !route.hidden);
export const getProtectedRoutes = () => routes.filter(route => route.protected);
export const getAdminRoutes = () => routes.filter(route => route.adminOnly);
export const getHiddenRoutes = () => routes.filter(route => route.hidden);
