import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import Sidebar, { SidebarField } from './assets/sidebar'
import Sequencer from './assets/sequencer'
import Settings from './assets/settings'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

const audioFiles = import.meta.glob('./audio/*.wav', { eager: true })
const audioList = Object.fromEntries(
  Object.entries(audioFiles).map(([key, value]) => [
    key.replace('./audio/', '').replace('.wav', ''),
    value.default,
  ])
)

function getData(item) {
  return item?.data?.current ?? {}
}

function PlaylistRowOverlay({ row }) {
  return (
    <div className="sortable-row row-drag-overlay">
      <div className="sample-area">
        <div className="sample block delete-sample">
          <p><span className="material-symbols-outlined">delete</span></p>
        </div>
        <div className="sample block sample-label"><p>{row.audioFile}</p></div>
      </div>
      <div className="step-sequencer" style={{ gridTemplateColumns: `repeat(${row.steps.length}, 1fr)` }}>
        {row.steps.map((active, index) => (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={`block ${((index % 8) - (index % 4) === 0 ? 'even' : 'odd')} ${active ? 'active' : 'not-active'}`}
            key={index}
          > | </button>
        ))}
      </div>
    </div>
  )
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
  const rowDragBoundsRef = useRef(null)
  const initialActiveNodeRectRef = useRef(null)
  const rowSlotRectsRef = useRef([])
  const [activeSidebarField, setActiveSidebarField] = useState(null)
  const [activeRow, setActiveRow] = useState(null)
  const [activeRowSlotIndex, setActiveRowSlotIndex] = useState(null)
  const [dragOverTarget, setDragOverTarget] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const restrictRowDrag = useCallback(({ activeNodeRect, transform }) => {
    const bounds = rowDragBoundsRef.current
    const initialRect = initialActiveNodeRectRef.current || activeNodeRect
    if (!initialRect || !bounds) return { ...transform, x: 0 }

    return {
      ...transform,
      x: 0,
      y: Math.max(
        bounds.top - initialRect.top,
        Math.min(transform.y, bounds.bottom - initialRect.bottom),
      ),
    }
  }, [])

  const snapRowOverlayToSlot = useCallback(({ transform }) => {
    const slots = rowSlotRectsRef.current
    const originIndex = dragTypeRef.current?.originIndex
    const originSlot = slots[originIndex]
    const targetSlot = slots[activeRowSlotIndex]

    if (!originSlot || !targetSlot) return { ...transform, x: 0 }

    return {
      ...transform,
      x: 0,
      y: targetSlot.top - originSlot.top,
    }
  }, [activeRowSlotIndex])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code !== 'Space' || event.repeat) return

      event.preventDefault()
      setPlay((isPlaying) => !isPlaying)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const resetDrag = () => {
    dragTypeRef.current = null
    rowDragBoundsRef.current = null
    initialActiveNodeRectRef.current = null
    rowSlotRectsRef.current = []
    setActiveSidebarField(null)
    setActiveRow(null)
    setActiveRowSlotIndex(null)
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
      initialActiveNodeRectRef.current = active.rect.current?.translated || active.rect.current?.initial || null
      const rowElements = Array.from(document.querySelectorAll('.sortable-row:not(.row-drag-overlay)'))
      const rowRects = rowElements
        .map((element) => element.getBoundingClientRect())
        .sort((first, second) => first.top - second.top)
      const originIndex = rows.findIndex((item) => item.id === row.id)
      rowSlotRectsRef.current = rowRects
      rowDragBoundsRef.current = rowRects.length
        ? {
            top: Math.min(...rowRects.map((rect) => rect.top)),
            bottom: Math.max(...rowRects.map((rect) => rect.bottom)),
          }
        : null
      dragTypeRef.current = { type: 'row', rowId: row.id, originIndex }
      setActiveRow(row)
      setActiveRowSlotIndex(originIndex)
    }
  }

  const handleDragOver = ({ over }) => {
    if (dragTypeRef.current?.type === 'row') {
      if (!over) return

      const targetIndex = rows.findIndex((row) => row.id === over.id)
      if (targetIndex !== -1) {
        setActiveRowSlotIndex((currentIndex) => (
          currentIndex === targetIndex ? currentIndex : targetIndex
        ))
      }
      return
    }

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
      // Rows must sort against other rows only. Sample-label and sequencer
      // droppables are for sidebar samples and otherwise make sorting jumpy.
      return closestCenter(args).filter(({ id }) => rows.some((row) => row.id === id))
    }

    const collisions = pointerWithin(args)
    const sampleLabel = collisions.find(({ id }) => String(id).startsWith('sample-label-'))
    if (sampleLabel) return [sampleLabel]

    // Playlist rows are sortable only when an existing row is being dragged.
    // A sidebar sample should treat all other sequencer space as an add target.
    const sequencer = collisions.find(({ id }) => id === 'sequencer')
    return sequencer ? [sequencer] : []
  }

  const handleDragEnd = ({ active, over }) => {
    const drag = dragTypeRef.current
    if (!drag) {
      resetDrag()
      return
    }

    if (drag.type === 'row') {
      if (over && active.id !== over.id) {
        setRows((currentRows) => {
          const activeIndex = currentRows.findIndex((row) => row.id === active.id)
          const overIndex = currentRows.findIndex((row) => row.id === over.id)
          if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
            return arrayMove(currentRows, activeIndex, overIndex)
          }
          return currentRows
        })
      }
      resetDrag()
      return
    }

    const overData = getData(over)
    if (drag.type === 'sidebar') {
      setRows((currentRows) => {
        // A sound can appear only once in the playlist. This applies to both
        // adding a new row and replacing an existing row.
        if (currentRows.some((row) => row.audioFile === drag.audioFile)) {
          return currentRows
        }

        // Only a sample label accepts a replacement. Retain its pattern.
        if (overData.target === 'sample-label' && Number.isInteger(overData.index)) {
          return currentRows.map((row, index) => (
            index === overData.index
              ? { ...row, audioFile: drag.audioFile }
              : row
          ))
        }

        if (!over || over.id !== 'sequencer') return currentRows

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
    }

    resetDrag()
  }

  const sleepTime = (60 / Number(bpm || 1)) * 1000 / 4

  return (
    <div className="wrapper">
      <DndContext
        collisionDetection={detectCollision}
        modifiers={activeRow ? [restrictRowDrag] : undefined}
        sensors={sensors}
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
            newBpm={setBpm}
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
        <DragOverlay
          dropAnimation={false}
          modifiers={activeRow ? [snapRowOverlayToSlot] : undefined}
          transition="transform 180ms ease"
        >
          {activeSidebarField ? <SidebarField overlay audioFile={activeSidebarField} /> : null}
          {!activeSidebarField && activeRow ? <PlaylistRowOverlay row={activeRow} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default App
