import React from 'react';
import SampleArea from './samplearea';

const SampleRow = (props) => {
    
    const toggleIndex = (index) => {
        props.setStep((prevArray) => {
            return prevArray.map((row, rowIndex) => {
                if (rowIndex === props.index) {
                    return row.map((value, i) => (i === index ? !value : value));
                }
                return row;
            });
        });
    };

    if (!props.step || !Array.isArray(props.step)) {
        return <div>Loading...</div>
    }

    console.log('samplerow step: ', props.step)
    return (
        <>
            <SampleArea audio={props.audio} />
            <div className='step-sequencer' style={{'gridTemplateColumns': `repeat(${props.steps}, 1fr)`}}>
                    {props.step == [] || props.step === undefined ? null :
                        Object.keys(props.step[props.index]).length >0 ?
                            props.step[props.index].map((val, idx) => {
                                return <button onClick={() => toggleIndex( idx)} className={ `block ${((idx % 8) - (idx % 4) == 0 ? 'even' : 'odd')} ${(val ? 'active' : 'not-active')}` } key={idx}> | </button>
                            }) : null
                        }
            </div>
        </>
    )
}

export default SampleRow