import React from 'react'

const SampleArea = (props) => {
    
    return (
        <div className='sample-area'>
            <div className='sample block' onClick={ () => props.delete(props.index) }>
                <p>
                    <span className="material-symbols-outlined">
                        delete
                    </span>
                </p>
            </div>
            <div onClick={ () => props.playSound(props.audio) } className='sample block'>
                <p>{props.audio}</p>
            </div>
        </div>
    )
}

export default SampleArea;