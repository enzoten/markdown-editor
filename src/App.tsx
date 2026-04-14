import Editor from './Editor'
import './app.css'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Markdown Editor — Zero Syntax Reveal Prototype</h1>
      </header>
      <main className="app-main">
        <Editor />
      </main>
    </div>
  )
}
