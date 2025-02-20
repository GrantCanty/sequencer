import { useState } from 'react'
import './App.css'
import './assets/sidebar'
import Sidebar from './assets/sidebar'
import Sequencer from './assets/sequencer'
import Settings from './assets/settings'

function App() {
  const [play, setPlay] = useState(false)
  
  const [bpm, setBpm] = useState('125')

  const togglePlay = () => {
    setPlay((prevState) => !prevState)
  }

  function newBpm(e) {
    if (e.target.value >= 0) {
      setBpm(e.target.value)
    }
  }
  const steps_per_beat = 2
  let sleepTime =  (60 / bpm) * 1000 / steps_per_beat


  return (
    <div className='wrapper'>
      <Sidebar />
      <div className='main-wrapper'>
      <Settings play={play} togglePlay={togglePlay} bpm={bpm} newBpm={newBpm} />
      <Sequencer sleepTime={sleepTime} play={play} />
      </div>
    </div>
  )
}

export default App