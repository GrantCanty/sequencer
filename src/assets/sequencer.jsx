import React from 'react'
import '../styles/sequencer.css'
import { useState, useEffect, useRef } from 'react'



const Sequencer = (props) => {
    const steps = 16
    const stepRange = Array(steps).fill(false)

    const [step, setStep] = useState(stepRange)
    const stepRef = useRef(step)
    const [stepIndex, setStepIndex] = useState(0)
    const intervalRef = useRef(null); // Stores the interval ID

    useEffect(() => {
        stepRef.current = step;
    }, [step]);

    const toggleIndex = (index) => {
        setStep((prevArray) =>
          prevArray.map((value, i) => (i === index ? !value : value))
        );
    };

    /*function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }*/

    const playSound = () => {
        const audioInstance = new Audio(props.audio);
        audioInstance.play();
    };

    //const audio = new Audio(props.audio)
    useEffect(() => {
        if (props.play) {
            setStepIndex(0);
            let i = 0;
            let lastTime = performance.now(); // Track when the last step was triggered
            const stepDuration = props.sleepTime; // Time per step in ms

            intervalRef.current = setInterval(() => {
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
            }, stepDuration / 10); // Run more frequently to check timing

        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [props.play, props.sleepTime]);

    return (
        <div className='sequencer-wrapper'>
            <h1>sequencer!!</h1>
            <div className='sequencer'>
                <div className='sample block'>
                    <p>sample</p>
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