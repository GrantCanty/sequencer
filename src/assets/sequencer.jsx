import React from 'react'
import '../styles/sequencer.css'
import { useState, useEffect, useRef } from 'react'
import SampleRow from './samplerow'

const Sequencer = (props) => {
    const steps = 16
    const defaultSounds = ['clap 1', 'kick 1', 'snare 1']
    
    const [sounds, setSounds] = useState({});
    const [step, setStep] = useState(() => createAndFillTwoDArray({ rows: defaultSounds.length, columns: steps, defaultValue: false }));
    const stepRef = useRef(step)    

    function createAndFillTwoDArray({rows, columns, defaultValue}) {
        return Array.from({ length:rows }, () => Array.from({ length:columns }, ()=> defaultValue))
    }
    
    useEffect(() => {
        if(!props.audioList) return
        
        const newSounds = {}
        defaultSounds.forEach((val) => {
            newSounds[val] = props.audioList[val]
        });

        console.log('newSounds: ', newSounds)
    
        setSounds(newSounds);
    }, [props.audioList]);
    
    useEffect(() => {
        console.log('sounds', sounds)
        if (Object.keys(sounds).length > 0) {
            const stepRange = createAndFillTwoDArray({rows:Object.keys(sounds).length, columns:steps, defaultValue:false})
            setStep(stepRange)
        }
    }, [sounds])

    const [stepIndex, setStepIndex] = useState(0)
    const timeoutRef = useRef(null); 
    const audioContextRef = useRef(null);
    const audioBuffersRef = useRef(null);

    useEffect(() => {
        stepRef.current = step;
        console.log("step: ", step)
    }, [step]);

    /*useEffect(() => {
        const loadAudio = async () => {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const response = await fetch(props.audio);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            audioBufferRef.current = audioBuffer;
        };
        loadAudio();

        return () => {
            audioContextRef.current?.close(); // Closes the AudioContext when component unmounts
        };
    }, [props.audio]);*/

    useEffect(() => {
        if (!sounds || sounds === undefined || Object.keys(sounds).length === 0) {
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
            await Promise.all(Object.keys(sounds).map(async (file) => {
                try {
                    const response = await fetch(sounds[file])
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                    buffers[file] = audioBuffer;
                } catch(err) {
                    console.log(err)
                }
            }))   
            audioBuffersRef.current = buffers
            console.log(audioBuffersRef)
        }
        loadAudio()
    }, [sounds])

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

            if (stepRef.current[i]) {
                playSound();
            }

            let lastTime = performance.now(); // Track when the last step was triggered
            const stepDuration = props.sleepTime; // Time per step in ms

            const scheduleStep = () => {
                const currentTime = performance.now();
                const elapsedTime = currentTime - lastTime;

                if (elapsedTime >= stepDuration) {
                    i = (i+1) % steps
                    setStepIndex(i);
                    console.log("stepIndex: ", i)

                    if (stepRef.current[i]) {
                        playSound();
                    }

                    lastTime = currentTime - (elapsedTime % stepDuration); // Adjust for drift
                }

                timeoutRef.current = setTimeout(scheduleStep, stepDuration/10)
            }

            scheduleStep()

        } else {
            clearTimeout(timeoutRef.current);
        }

        return () => clearTimeout(timeoutRef.current);
    }, [props.play, props.sleepTime]);

    return (
        <div className='sequencer-wrapper'>
            <h1>sequencer!!</h1>
            <div className='sequencer'>
                {Object.keys(sounds).map((audio, index) => {
                    return <SampleRow key={index} index={index} audio={audio} playSound={playSound} steps={steps} step={step} setStep={setStep} />
                })}
                
            </div>
        </div>
    )
}

export default Sequencer;