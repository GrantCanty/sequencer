import React from 'react'
import '../styles/sequencer.css'
import { useState, useEffect } from 'react'



const Sequencer = (props) => {
    const steps = 16
    const range = []
    const rangerange = []
    for (let i = 0; i < steps; i++) {
        range[i] = i
        rangerange[i] = false
    }

    const [step, setStep] = useState(rangerange)

    const [stepIndex, setStepIndex] = useState(0)

    const toggleIndex = (index) => {
        console.log("index: ", index)
        setStep((prevArray) =>
          prevArray.map((value, i) => (i === index ? !value : value))
        );
    };

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    

    useEffect(() => {
        let isPlaying = props.play;
        let i = 0;

        async function cycle() {
            while (isPlaying) {
                setStepIndex(i);
                
                await sleep(props.sleepTime);

                i = (i + 1) % range.length;
            }
        }

        if (props.play) {
            cycle();
        }

        return () => {
            isPlaying = false;
        };
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