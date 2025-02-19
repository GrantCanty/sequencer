import React from 'react'
import '../styles/sequencer.css'
import { useState } from 'react'


const Sequencer = () => {
    const [step, setStep] = useState([false, false, false, false, false, false, false, false])

    const toggleIndex = (index) => {
        console.log("index: ", index)
        setStep((prevArray) =>
          prevArray.map((value, i) => (i === index ? !value : value))
        );
    };

    const range = []
        for (let i = 0; i < 8; i++) {
            range[i] = i
    }

    return (
        <div className='sequencer-wrapper'>
            <h1>sequencer!!</h1>
            <div className='sequencer'>
                <div className='sample block'>
                    <p>sample</p>
                </div>
                <div className='step-sequencer'>
                    {step.map((val, idx) => {
                        return <button className='block' key={idx} onClick={() => toggleIndex(idx)}> {idx} {val | 0} </button>
                    })}
                </div>
            </div>
        </div>
    )
}

export default Sequencer;