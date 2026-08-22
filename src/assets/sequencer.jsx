import React from 'react'
import '../styles/sequencer.css'
import { useState, useEffect, useRef } from 'react'
import SampleRow from './samplerow'
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";

export function Row(props) {
    const { audio, overlay, ...rest } = props;
  
    let className = "canvas-field";
    if (overlay) {
      className += " overlay";
    }
  
    return (
      <div className={className}>
        <div>{audio} </div>
      </div>
    );
  }

function SortableRow(props) {
    const { row, index, playSound, steps, setRows, delete: deleteRow, isReplaceTarget } = props;
  
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition
    } = useSortable({
      id: row.id,
      data: {
        index,
        id: row.id,
        row
      }
    });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition
    };
  
    return (
      <div className="sortable-row" ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <SampleRow
            index={index}
            row={row}
            playSound={playSound}
            steps={steps}
            setRows={setRows}
            delete={deleteRow}
            isReplaceTarget={isReplaceTarget}
        />
      </div>
    );
  }

const Sequencer = (props) => {
    const steps = 32
    const rows = props.rows || []
    const setRows = props.setRows
    const rowsRef = useRef(rows)
    const [stepIndex, setStepIndex] = useState(0)
    const timeoutRef = useRef(null); 
    const audioContextRef = useRef(null);
    const audioBuffersRef = useRef(null); 

    useEffect(() => {
        rowsRef.current = rows;
    }, [rows]);

    useEffect(() => {
        if (!rows.length) {
            return
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        } else if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume();
        } else {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const loadAudio = async () => {
            const buffers = {};
            await Promise.all(rows.map(async (row) => {
                try {
                    const response = await fetch(props.audioList[row.audioFile])
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                    buffers[row.audioFile] = audioBuffer;
                } catch(err) {
                    console.log(err)
                }
            }))   
            audioBuffersRef.current = buffers
        }
        loadAudio()
    }, [rows, props.audioList])

    const playSound = (file) => {
        if (!audioContextRef.current || !audioBuffersRef.current[file]) return;

        if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume();
        }
        
        if (audioContextRef.current && audioBuffersRef.current[file]) {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffersRef.current[file];
            source.connect(audioContextRef.current.destination);
            source.start();
        }
    };

    useEffect(() => {        
        if (props.play) {
            setStepIndex(0);
            let i = 0;

            let lastTime = performance.now(); // Track when the last step was triggered
            const stepDuration = props.sleepTime; // Time per step in ms

            const scheduleStep = (firstRun = false) => {
                const currentTime = performance.now();
                const elapsedTime = currentTime - lastTime;

                if (firstRun || elapsedTime >= stepDuration) {
                    rowsRef.current.forEach((row) => {
                        if (row.steps[i]) {
                            playSound(row.audioFile)
                            firstRun = false
                        }
                    })

                    if(!firstRun) {
                        setStepIndex(i);
                        i = (i+1) % steps
                        lastTime = currentTime - (elapsedTime % stepDuration); // Adjust for drift
                    }
                }

                timeoutRef.current = setTimeout(scheduleStep, stepDuration/10)
            }
            scheduleStep(true)

        } else {
            clearTimeout(timeoutRef.current);
        }

        return () => clearTimeout(timeoutRef.current);
    // rowsRef always holds the latest pattern, so changing one step should not
    // restart playback from the first column.
    }, [props.play, props.sleepTime]);

    const deleteBlock = (index) => {
        setRows((currentRows) => currentRows.filter((_, rowIndex) => rowIndex !== index))
    }

    const { setNodeRef } = useDroppable({
        id: "sequencer",
    });

    return (
        <div ref={setNodeRef} className={`sequencer-wrapper drop-zone ${props.isSidebarDragging ? 'drop-zone-active' : ''}`} >
            <h1>sequencer!!</h1>
            <div className='sequencer'>
                <div className='sample-area'>
                    <div className='sample block'>
                        <p></p>
                    </div>
                    <div className='sample block'>
                        <p>{""}</p>
                    </div>
                </div>
                <div className='step-sequencer' style={{'gridTemplateColumns': `repeat(${steps}, 1fr)`}}>
                    {rows[0]?.steps.length > 0 ?
                            rows[0].steps.map((_, idx) => {
                                return <div className={ `block ${stepIndex === idx ? 'active' : 'not-active'}` } key={idx}> { (idx / ((idx % 4)+1) / 4 + 1) % 1 == 0 ? idx / ((idx % 4)+1) / 4 % 4 + 1 : null } </div>
                            }) : null
                    }
                </div>

                <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
                    {rows.map((row, index) => (
                        <SortableRow
                            key={row.id}
                            row={row}
                            index={index}
                            playSound={playSound}
                            steps={steps}
                            setRows={setRows}
                            delete={deleteBlock}
                            isReplaceTarget={props.replaceTargetId === row.id}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    )
}

export default Sequencer;
