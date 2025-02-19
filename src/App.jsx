import { useState } from 'react'
import './App.css'
import './assets/sidebar'
import Sidebar from './assets/sidebar'
import Sequencer from './assets/sequencer'

function App() {
  const [play, setPlay] = useState(false)
  
  

  const togglePlay = () => {
    setPlay((prevState) => !prevState)
  }

  

  return (
    <div className='wrapper'>
      <Sidebar />
      <Sequencer />
    </div>
  )
}

export default App
