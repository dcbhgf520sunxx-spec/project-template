import { Spin } from 'antd';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export function AppRouter() {
  return (
    <RouterProvider
      router={router}
      fallbackElement={<div className="app-route-loading"><Spin /></div>}
      future={{ v7_startTransition: true }}
    />
  );
}
