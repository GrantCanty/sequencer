import React from 'react';
import SampleArea from './samplearea';

const SampleRow = (props) => {
    
    const toggleIndex = (index) => {
        props.setRows((currentRows) => currentRows.map((row, rowIndex) => {
            if (rowIndex !== props.index) return row;
            return {
                ...row,
                steps: row.steps.map((value, stepIndex) => (
                    stepIndex === index ? !value : value
                )),
            };
        }));
    };

    if (!props.row || !Array.isArray(props.row.steps)) {
        return <div>Loading...</div>
    }

    return (
        <>
            <SampleArea index={props.index} audio={props.row.audioFile} playSound={props.playSound} delete={props.delete} />
            <div className='step-sequencer' style={{'gridTemplateColumns': `repeat(${props.steps}, 1fr)`}}>
                    {props.row.steps.length > 0 ?
                            props.row.steps.map((val, idx) => {
                                return <button onClick={() => toggleIndex( idx)} className={ `block ${((idx % 8) - (idx % 4) == 0 ? 'even' : 'odd')} ${(val ? 'active' : 'not-active')}` } key={idx}> | </button>
                            }) : null
                    }
            </div>
        </>
    )
}

export default SampleRow
