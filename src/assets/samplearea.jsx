import React from 'react'
import { useDroppable } from '@dnd-kit/core'

const SampleArea = (props) => {
    const { setNodeRef } = useDroppable({
        id: `sample-label-${props.rowId}`,
        data: {
            target: 'sample-label',
            rowId: props.rowId,
            index: props.index,
        },
    })
    
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
            <div ref={setNodeRef} onClick={ () => props.playSound(props.audio) } className={`sample block sample-label ${props.isReplaceTarget ? 'replace-target' : ''}`}>
                <p>{props.audio}</p>
            </div>
        </div>
    )
}

export default SampleArea;
