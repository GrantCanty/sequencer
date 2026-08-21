import React from 'react'

const SampleArea = (props) => {
    
    return (
        <div className='sample-area'>
            <button
                type="button"
                className='sample block delete-sample'
                aria-label={`Delete ${props.audio}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => props.delete(props.index)}
            >
                <p>
                    <span className="material-symbols-outlined">
                        delete
                    </span>
                </p>
            </button>
            <div onClick={ () => props.playSound(props.audio) } className='sample block'>
                <p>{props.audio}</p>
            </div>
        </div>
    )
}

export default SampleArea;
