import React from 'react'
import '../styles/sequencer.css'
import { useState, useEffect, useRef } from 'react'
import SampleRow from './samplerow'
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

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
    const { id, index, audio } = props;
  
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition
    } = useSortable({
      id,
      data: {
        index,
        id,
        audio
      }
    });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition
    };
  
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Row audio={audio} />
      </div>
    );
  }

const Sequencer = (props) => {
    const steps = 32
    const defaultSounds = ['clap 1', 'kick 1', 'snare 1']
    
    const [rows, setRows] = useState(() => defaultSounds.map((audioFile, index) => ({
        id: `default-${index}`,
        audioFile,
        steps: Array(steps).fill(false),
    })));
    const rowsRef = useRef(rows)
    const [stepIndex, setStepIndex] = useState(0)
    const timeoutRef = useRef(null); 
    const audioContextRef = useRef(null);
    const audioBuffersRef = useRef(null); 

    useEffect(() => {
        if(!props.audioList) return
        
        setRows((currentRows) => currentRows.map((row) => ({
            ...row,
            audio: props.audioList[row.audioFile],
        })));
    }, [props.audioList]);

    // new dropped fields
    useEffect(() => {
        if (!props.droppedFields || !props.audioList) return;
        
        const existingIds = new Set(rowsRef.current.map((row) => row.id));
        const newRows = props.droppedFields
            .filter((field) => !existingIds.has(field.id) && props.audioList[field.audioFile])
            .map((field) => ({
                id: field.id,
                audioFile: field.audioFile,
                audio: props.audioList[field.audioFile],
                steps: Array(steps).fill(false),
            }));

        if (newRows.length) {
            setRows((currentRows) => [...currentRows, ...newRows]);
        }
    }, [props.droppedFields, props.audioList]);

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
                    const response = await fetch(row.audio || props.audioList[row.audioFile])
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
    }, [props.play, props.sleepTime, rows]);

    const deleteBlock = (index) => {
        setRows((currentRows) => currentRows.filter((_, rowIndex) => rowIndex !== index))
    }

    const { setNodeRef, isOver } = useDroppable({
        id: "sequencer",
    });

    const handleDragEnd = (event) => {
        const { active } = event; // Get the dragged item
        console.log("Drag End Event:", event);
        
        if (active && active.data.current?.fromSidebar) {
            console.log("Dropped from Sidebar:", active.data.current.audioFile);
        }
    };

    return (
        <div ref={setNodeRef} className='sequencer-wrapper drop-zone' style={{ backgroundColor: isOver ? "lightblue" : "black" }} >
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

                {rows.map((row, index) => {
                    return <SampleRow key={row.id} index={index} row={row} playSound={playSound} steps={steps} setRows={setRows} delete={deleteBlock} />
                })}
            </div>
        </div>
    )
}

export default Sequencer;
