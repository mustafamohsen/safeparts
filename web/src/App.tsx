// @ts-nocheck
import { useState } from 'react'

import { CombineForm } from './components/CombineForm'
import { SplitForm } from './components/SplitForm'

export function App() {
  const [tab, setTab] = useState<'split' | 'combine'>('split')

  return (
    <div className="container">
      <header className="header">
        <h1>Safeparts</h1>
        <nav className="tabs">
          <button type="button" className={tab === 'split' ? 'tab active' : 'tab'} onClick={() => setTab('split')}>
            Split
          </button>
          <button type="button"
            className={tab === 'combine' ? 'tab active' : 'tab'}
            onClick={() => setTab('combine')}
          >
            Combine
          </button>
        </nav>
      </header>

      {tab === 'split' ? <SplitForm /> : <CombineForm />}
    </div>
  )
}
