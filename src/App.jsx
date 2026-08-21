import { useState, useRef } from 'react'
import './App.css'
import './assets/sidebar'
import Sidebar, { SidebarField } from './assets/sidebar'
import Sequencer from './assets/sequencer'
import Settings from './assets/settings'
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useImmer } from "use-immer";

function getData(prop) {
  return prop?.data?.current ?? {};
}

function createSpacer({ id }) {
  return {
    id,
    type: "spacer",
    title: "spacer"
  };
}

function App() {
  const [play, setPlay] = useState(false)
  const [bpm, setBpm] = useState('125')

  const [sidebarFieldsRegenKey, setSidebarFieldsRegenKey] = useState(
    Date.now()
  );
  const spacerInsertedRef = useRef();
  const currentDragFieldRef = useRef();
  const [activeSidebarField, setActiveSidebarField] = useState();
  const [activeField, setActiveField] = useState();
  const [data, updateData] = useImmer({
    fields: []
  });

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

  const cleanUp = () => {
    setActiveSidebarField(null);
    setActiveField(null);
    currentDragFieldRef.current = null;
    spacerInsertedRef.current = false;
  };

  const handleDragStart = (e) => {
    const { active } = e;
    const activeData = getData(active);

    if (activeData.fromSidebar) {
      const { audioFile } = activeData;
      setActiveSidebarField(audioFile);
      currentDragFieldRef.current = {
        id: active.id,
        name: audioFile,
        type: "audio",
        audioFile: audioFile
      };
      return;
    }

    const { field, index } = activeData;
    setActiveField(field);
    currentDragFieldRef.current = field;
    updateData((draft) => {
      draft.fields.splice(index, 1, createSpacer({ id: active.id }));
    });
  };

  const handleDragOver = (e) => {
    const { active, over } = e;
    const activeData = getData(active);

    if (activeData.fromSidebar) {
      const overData = getData(over);

      if (!spacerInsertedRef.current) {
        const spacer = createSpacer({
          id: active.id + "-spacer"
        });

        updateData((draft) => {
          if (!draft.fields.length) {
            draft.fields.push(spacer);
          } else {
            const nextIndex =
              overData.index > -1 ? overData.index : draft.fields.length;

            draft.fields.splice(nextIndex, 0, spacer);
          }
          spacerInsertedRef.current = true;
        });
      } else if (!over) {
        updateData((draft) => {
          draft.fields = draft.fields.filter((f) => f.type !== "spacer");
        });
        spacerInsertedRef.current = false;
      } else {
        updateData((draft) => {
          const spacerIndex = draft.fields.findIndex(
            (f) => f.id === active.id + "-spacer"
          );

          const nextIndex =
            overData.index > -1 ? overData.index : draft.fields.length - 1;

          if (nextIndex === spacerIndex) {
            return;
          }

          draft.fields = arrayMove(draft.fields, spacerIndex, overData.index);
        });
      }
    }
  };

  const handleDragEnd = (e) => {
    const { active, over } = e;

    if (!over) {
      updateData((draft) => {
        draft.fields = draft.fields.filter((f) => f.type !== "spacer");
      });
      cleanUp();
      return;
    }

    if (over.id === "sequencer") {
      const nextField = currentDragFieldRef.current;
      if (nextField) {
        if (nextField.audioFile) {
          updateData((draft) => {
            const spacerIndex = draft.fields.findIndex(
              (f) => f.id === active.id + "-spacer"
            );

            if (spacerIndex >= 0) {
              draft.fields[spacerIndex] = nextField;
            } else {
              draft.fields.push(nextField);
            }
          });
        }
      }
    } else {
      updateData((draft) => {
        draft.fields = draft.fields.filter((f) => f.type !== "spacer");
      });
    }

    cleanUp();
  };

  return (
    <div className='wrapper'>
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Sidebar audioList={audioList} fieldsRegKey={sidebarFieldsRegenKey} />
        <div className='main-wrapper'>
          <Settings play={play} togglePlay={togglePlay} bpm={bpm} newBpm={newBpm} />
          <SortableContext
            strategy={verticalListSortingStrategy}
            items={Object.keys(audioList).map((e) => e )}
          >
            <Sequencer sleepTime={sleepTime} play={play} audioList={audioList} droppedFields={data.fields.filter(f => f.type === "audio")}/>
          </SortableContext>
        </div>
        <DragOverlay dropAnimation={false}>
            {activeSidebarField ? (
              <SidebarField overlay audioFile={activeSidebarField} />
            ) : null}
            {activeField ?  <div className="dragging-field">{activeField.name}</div> : null}
          </DragOverlay>
      </DndContext>
    </div>
  )
}

export default App
