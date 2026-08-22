import { useRef, useState } from 'react'
import './App.css'
import Sidebar, { SidebarField } from './assets/sidebar'
import Sequencer from './assets/sequencer'
import Settings from './assets/settings'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

function getData(item) {
  return item?.data?.current ?? {}
}

function App() {
  const [play, setPlay] = useState(false)
  const [bpm, setBpm] = useState('125')
  const [rows, setRows] = useState([
    { id: 'default-clap', audioFile: 'clap 1', steps: Array(32).fill(false) },
    { id: 'default-kick', audioFile: 'kick 1', steps: Array(32).fill(false) },
    { id: 'default-snare', audioFile: 'snare 1', steps: Array(32).fill(false) },
  ])
  const dragTypeRef = useRef(null)
  const [activeSidebarField, setActiveSidebarField] = useState(null)
  const [activeRow, setActiveRow] = useState(null)

  const audioFiles = import.meta.glob('./audio/*.wav', { eager: true })
  const audioList = Object.fromEntries(
    Object.entries(audioFiles).map(([key, value]) => [
      key.replace('./audio/', '').replace('.wav', ''),
      value.default,
    ])
  )

  const resetDrag = () => {
    dragTypeRef.current = null
    setActiveSidebarField(null)
    setActiveRow(null)
  }

  const handleDragStart = ({ active }) => {
    const data = getData(active)

    if (data.fromSidebar) {
      dragTypeRef.current = { type: 'sidebar', audioFile: data.audioFile }
      setActiveSidebarField(data.audioFile)
      return
    }

    const row = rows.find((item) => item.id === active.id)
    if (row) {
      dragTypeRef.current = { type: 'row', rowId: row.id }
      setActiveRow(row)
    }
  }

  const handleDragEnd = ({ active, over }) => {
    const drag = dragTypeRef.current
    if (!drag || !over) {
      resetDrag()
      return
    }

    const overData = getData(over)
    const targetIndex = Number.isInteger(overData.index) ? overData.index : rows.length

    if (drag.type === 'sidebar') {
      setRows((currentRows) => {
        // A row target means replacement: retain the row identity and pattern.
        if (over.id !== 'sequencer' && Number.isInteger(overData.index)) {
          return currentRows.map((row, index) => (
            index === overData.index
              ? { ...row, audioFile: drag.audioFile }
              : row
          ))
        }

        // Dropping onto the empty board appends a new row.
        const newRow = {
          id: `row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          audioFile: drag.audioFile,
          steps: Array(32).fill(false),
        }
        const nextRows = [...currentRows]
        nextRows.splice(Math.min(targetIndex, nextRows.length), 0, newRow)
        return nextRows
      })
    } else if (drag.type === 'row' && over.id !== 'sequencer') {
      setRows((currentRows) => {
        const fromIndex = currentRows.findIndex((row) => row.id === active.id)
        const boundedTarget = Math.min(targetIndex, currentRows.length - 1)
        return fromIndex === -1 || fromIndex === boundedTarget
          ? currentRows
          : arrayMove(currentRows, fromIndex, boundedTarget)
      })
    }

    resetDrag()
  }

  const sleepTime = (60 / Number(bpm || 1)) * 1000 / 4

  return (
    <div className="wrapper">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Sidebar audioList={audioList} />
        <div className="main-wrapper">
          <Settings
            play={play}
            togglePlay={() => setPlay((previous) => !previous)}
            bpm={bpm}
            newBpm={(event) => setBpm(event.target.value)}
          />
          <Sequencer
            sleepTime={sleepTime}
            play={play}
            audioList={audioList}
            rows={rows}
            setRows={setRows}
          />
        </div>
        <DragOverlay dropAnimation={false}>
          {activeSidebarField ? <SidebarField overlay audioFile={activeSidebarField} /> : null}
          {activeRow ? <div className="dragging-field">{activeRow.audioFile}</div> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default App
