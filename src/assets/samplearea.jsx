import React from 'react'

const SampleArea = (props) => {
    
    return (
        <div className='sample-area'>
            <div className='sample block'>
                <p>delete</p>
            </div>
            <div onClick={ () => props.playSound() } className='sample block'>
                <p>{props.audio}</p>
            </div>
        </div>
    )
}

export default SampleArea;