import { useState, useRef } from 'react'
import './App.css'
import './assets/sidebar'
import Sidebar from './assets/sidebar'
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

    // This is where the cloning starts.
    // We set up a ref to the field we're dragging
    // from the sidebar so that we can finish the clone
    // in the onDragEnd handler.
    if (activeData.fromSidebar) {
      const { audioFile } = activeData;
      setActiveSidebarField(audioFile);
      // Create a new field that'll be added to the fields array
      // if we drag it over the canvas.
      currentDragFieldRef.current = {
        id: active.id,
        name: audioFile,
        parent: null
      };
      return;
    }

    // We aren't creating a new element so go ahead and just insert the spacer
    // since this field already belongs to the canvas.
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

    // Once we detect that a sidebar field is being moved over the canvas
    // we create the spacer using the sidebar fields id with a spacer suffix and add into the
    // fields array so that it'll be rendered on the canvas.

    // 🐑 CLONING 🐑
    // This is where the clone occurs. We're taking the id that was assigned to
    // sidebar field and reusing it for the spacer that we insert to the canvas.
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
        // This solves the issue where you could have a spacer handing out in the canvas if you drug
        // a sidebar item on and then off
        updateData((draft) => {
          draft.fields = draft.fields.filter((f) => f.type !== "spacer");
        });
        spacerInsertedRef.current = false;
      } else {
        // Since we're still technically dragging the sidebar draggable and not one of the sortable draggables
        // we need to make sure we're updating the spacer position to reflect where our drop will occur.
        // We find the spacer and then swap it with the over skipping the op if the two indexes are the same
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
    const { over } = e;

    // We dropped outside of the over so clean up so we can start fresh.
    if (!over) {
      cleanUp();
      updateData((draft) => {
        draft.fields = draft.fields.filter((f) => f.type !== "spacer");
      });
      return;
    }

    // This is where we commit the clone.
    // We take the field from the this ref and replace the spacer we inserted.
    // Since the ref just holds a reference to a field that the context is aware of
    // we just swap out the spacer with the referenced field.
    let nextField = currentDragFieldRef.current;

    if (nextField) {
      const overData = getData(over);

      updateData((draft) => {
        const spacerIndex = draft.fields.findIndex((f) => f.type === "spacer");
        draft.fields.splice(spacerIndex, 1, nextField);

        draft.fields = arrayMove(
          draft.fields,
          spacerIndex,
          overData.index || 0
        );
      });
    }

    setSidebarFieldsRegenKey(Date.now());
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
        <Sequencer sleepTime={sleepTime} play={play} audioList={audioList} audio={audioList['clap 1']}/>
        </div>
      </DndContext>
    </div>
  )
}

export default App