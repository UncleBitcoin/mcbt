import BalanceTool from './BalanceTool'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">多链余额查询工具</div>
        <div className="app-desc">支持多链查询、查询标签、定时自动刷新与余额报警</div>
      </header>
      <BalanceTool />
    </div>
  )
}

export default App
