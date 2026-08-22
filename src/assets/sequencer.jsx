import React from 'react'
import '../styles/sequencer.css'
import { useState, useEffect, useMemo, useRef } from 'react'
import SampleRow from './samplerow'
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { defaultAnimateLayoutChanges, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";

function animateLayoutChanges(args) {
    if (args.isSorting) return true;
    if (args.wasDragging) return false;
    return defaultAnimateLayoutChanges(args);
}

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
      transition,
      isDragging,
    } = useSortable({
      id: row.id,
      data: {
        index,
        id: row.id,
        row
      },
      animateLayoutChanges,
      transition: {
        duration: 180,
        easing: 'ease',
      },
    });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : 1,
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
    const rowIds = useMemo(() => rows.map((row) => row.id), [rows])
    const rowsRef = useRef(rows)
    const stepDurationRef = useRef(props.sleepTime)
    const [stepIndex, setStepIndex] = useState(0)
    const timeoutRef = useRef(null); 
    const audioContextRef = useRef(null);
    const audioBuffersRef = useRef({});

    useEffect(() => {
        rowsRef.current = rows;
    }, [rows]);

    useEffect(() => {
        stepDurationRef.current = props.sleepTime;
    }, [props.sleepTime]);

    useEffect(() => {
        if (!rows.length) {
            return
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;
        
        const loadAudio = async () => {
            const buffers = { ...audioBuffersRef.current };
            const audioFilesToLoad = [...new Set(rows.map((row) => row.audioFile))];

            await Promise.all(audioFilesToLoad.map(async (audioFile) => {
                if (buffers[audioFile]) return;

                try {
                    const response = await fetch(props.audioList[audioFile])
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    buffers[audioFile] = audioBuffer;
                } catch(err) {
                    console.log(err)
                }
            }))   
            audioBuffersRef.current = buffers
        }
        loadAudio()
    }, [rows, props.audioList])

    useEffect(() => {
        const unlockAudio = () => {
            const audioContext = audioContextRef.current;
            if (audioContext?.state === 'suspended') {
                audioContext.resume().catch((error) => {
                    console.error('Unable to resume audio:', error);
                });
            }
        };

        document.addEventListener('pointerdown', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('pointerdown', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    const playSound = async (file) => {
        const audioBuffer = audioBuffersRef.current[file];
        if (!audioContextRef.current || !audioBuffer) return;

        const audioContext = audioContextRef.current;

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        if (audioContext.state !== 'running') return;

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    };

    useEffect(() => {        
        if (props.play) {
            setStepIndex(0);
            let i = 0;

            let lastTime = performance.now(); // Track when the last step was triggered
            const scheduleStep = (firstRun = false) => {
                const stepDuration = stepDurationRef.current;
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
    }, [props.play]);

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

                <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
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
