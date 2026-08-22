import { useRef, useState } from 'react'
import './App.css'
import Sidebar, { SidebarField } from './assets/sidebar'
import Sequencer from './assets/sequencer'
import Settings from './assets/settings'
import { closestCenter, DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'
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
  const [dragOverTarget, setDragOverTarget] = useState(null)

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
    setDragOverTarget(null)
  }

  const handleDragStart = ({ active }) => {
    const data = getData(active)

    if (data.fromSidebar) {
      dragTypeRef.current = { type: 'sidebar', audioFile: data.audioFile }
      setActiveSidebarField(data.audioFile)
      setDragOverTarget(null)
      return
    }

    const row = rows.find((item) => item.id === active.id)
    if (row) {
      dragTypeRef.current = { type: 'row', rowId: row.id }
      setActiveRow(row)
    }
  }

  const handleDragOver = ({ over }) => {
    if (dragTypeRef.current?.type !== 'sidebar') return

    if (!over) {
      setDragOverTarget(null)
    } else if (over.id === 'sequencer') {
      setDragOverTarget('sequencer')
    } else if (getData(over).target === 'sample-label') {
      setDragOverTarget(getData(over).rowId)
    } else {
      setDragOverTarget(null)
    }
  }

  const detectCollision = (args) => {
    if (!getData(args.active).fromSidebar) {
      return closestCenter(args)
    }

    const collisions = pointerWithin(args)
    const sampleLabel = collisions.find(({ id }) => String(id).startsWith('sample-label-'))
    if (sampleLabel) return [sampleLabel]

    const sortableRow = collisions.find(({ id }) => rows.some((row) => row.id === id))
    if (sortableRow) return [sortableRow]

    const sequencer = collisions.find(({ id }) => id === 'sequencer')
    return sequencer ? [sequencer] : []
  }

  const handleDragEnd = ({ active, over }) => {
    const drag = dragTypeRef.current
    if (!drag || !over) {
      resetDrag()
      return
    }

    const overData = getData(over)
    if (drag.type === 'sidebar') {
      setRows((currentRows) => {
        // Only a sample label accepts a replacement. Retain its pattern.
        if (overData.target === 'sample-label' && Number.isInteger(overData.index)) {
          return currentRows.map((row, index) => (
            index === overData.index
              ? { ...row, audioFile: drag.audioFile }
              : row
          ))
        }

        if (over.id !== 'sequencer') return currentRows

        // Dropping onto empty board space appends a new row.
        const newRow = {
          id: `row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          audioFile: drag.audioFile,
          steps: Array(32).fill(false),
        }
        const nextRows = [...currentRows]
        nextRows.push(newRow)
        return nextRows
      })
    } else if (drag.type === 'row' && over.id !== 'sequencer') {
      setRows((currentRows) => {
        const fromIndex = currentRows.findIndex((row) => row.id === active.id)
        const targetIndex = Number.isInteger(overData.index) ? overData.index : fromIndex
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
      <DndContext
        collisionDetection={detectCollision}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={resetDrag}
      >
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
            isSidebarDragging={dragOverTarget === 'sequencer'}
            replaceTargetId={dragOverTarget === 'sequencer' ? null : dragOverTarget}
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
