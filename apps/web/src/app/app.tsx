import { Navigate, Route, Routes } from 'react-router-dom';
import EditorPage from './editor/editor-page';
import { LoginPage } from './auth/login-page';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/diagrams/:diagramId/editor" element={<EditorPage />} />
    </Routes>
  );
}
export default App;
