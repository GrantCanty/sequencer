import { useState } from 'react'
import './App.css'
import './assets/sidebar'
import Sidebar from './assets/sidebar'
import Sequencer from './assets/sequencer'
import Settings from './assets/settings'
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

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

  const steps_per_beat = 4
  let sleepTime =  (60 / bpm) * 1000 / steps_per_beat
  const audioFiles = import.meta.glob('./audio/*.wav', { eager: true });
  const audioList = Object.fromEntries(
    Object.entries(audioFiles).map(([key, value]) => [key.replace('./audio/', '').replace('.wav', ''), value.default])
  );
  
  return (
    <div className='wrapper'>
      <DndContext
        onDragStart={() => {}}
        onDragOver={() => {}}
        onDragEnd={() => {}}
      >
        <Sidebar audioList={audioList} />
        <div className='main-wrapper'>
        <Settings play={play} togglePlay={togglePlay} bpm={bpm} newBpm={newBpm} />
        <Sequencer sleepTime={sleepTime} play={play} audioList={audioList} audio={audioList['clap 1']}/>
        </div>
      </DndContext>
    </div>
  )
}

export default App