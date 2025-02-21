import React from 'react';
import SampleArea from './samplearea';

const SampleRow = (props) => {
    return (
        <>
            <SampleArea audio={props.audio} />
            <div className='step-sequencer' style={{'gridTemplateColumns': `repeat(${props.steps}, 1fr)`}}>
                    {props.step.map((val, idx) => {
                        return <button onClick={() => toggleIndex(idx)} className={ `block ${((idx % 8) - (idx % 4) == 0 ? 'even' : 'odd')} ${(val ? 'active' : 'not-active')}` } key={idx}> | </button>
                    })}
            </div>
        </>
    )
}

export default SampleRow