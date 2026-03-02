import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApiProvider, useApi } from './hooks/useApi';
import Login from './pages/Login';
import Channels from './pages/Channels';
import ChannelDetail from './pages/ChannelDetail';
import Tasks from './pages/Tasks';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useApi();
  return token ? <>{children}</> : <Navigate to="/" />;
}

function App() {
  return (
    <ApiProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/channels" element={
            <PrivateRoute>
              <Channels />
            </PrivateRoute>
          } />
          <Route path="/channels/:id" element={
            <PrivateRoute>
              <ChannelDetail />
            </PrivateRoute>
          } />
          <Route path="/tasks" element={
            <PrivateRoute>
              <Tasks />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ApiProvider>
  );
}

export default App;