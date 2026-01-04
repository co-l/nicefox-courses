import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { ItemForm } from './pages/ItemForm'
import { ImportCSV } from './pages/ImportCSV'
import { Inventory } from './pages/Inventory'
import { Shopping } from './pages/Shopping'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/items/new" element={<ItemForm />} />
              <Route path="/items/:id" element={<ItemForm />} />
              <Route path="/items/import" element={<ImportCSV />} />
              <Route path="/shopping" element={<Shopping />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
