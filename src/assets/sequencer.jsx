import React from 'react'
import '../styles/sequencer.css'
import { useState, useEffect, useRef } from 'react'



const Sequencer = (props) => {
    const steps = 16
    const stepRange = Array(steps).fill(false)

    const [step, setStep] = useState(stepRange)
    const stepRef = useRef(step)
    const [stepIndex, setStepIndex] = useState(0)
    const timeoutRef = useRef(null); 
    const audioContextRef = useRef(null);
    const audioBufferRef = useRef(null);

    useEffect(() => {
        stepRef.current = step;
    }, [step]);

    const toggleIndex = (index) => {
        setStep((prevArray) =>
          prevArray.map((value, i) => (i === index ? !value : value))
        );
    };

    useEffect(() => {
        const loadAudio = async () => {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const response = await fetch(props.audio);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            audioBufferRef.current = audioBuffer;
        };
        loadAudio();
    }, [props.audio]);

    const playSound = () => {
        if (audioContextRef.current && audioBufferRef.current) {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBufferRef.current;
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
                <div className='sample-area'>
                    <div className='sample block'>
                        <p>delete</p>
                    </div>
                    <div onClick={ () => playSound() } className='sample block'>
                        <p>sample</p>
                    </div>
                </div>
                <div className='step-sequencer' style={{'grid-template-columns': `repeat(${steps}, 1fr)`}}>
                    {step.map((val, idx) => {
                        return <button onClick={() => toggleIndex(idx)} className={'block ' + ((idx % 8) - (idx % 4) == 0 ? 'even' : 'odd') + ' ' + (val ? 'active' : 'not-active') } key={idx}> | </button>
                    })}
                </div>
            </div>
        </div>
    )
}

export default Sequencer;