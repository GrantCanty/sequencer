import { useCallback, useEffect, useRef } from 'react';
import SampleArea from './samplearea';

const SampleRow = (props) => {
    const isPaintingRef = useRef(false);
    const paintValueRef = useRef(false);
    const lastPaintedIndexRef = useRef(null);

    const paintRange = (startIndex, endIndex, nextValue) => {
        const rangeStart = Math.min(startIndex, endIndex);
        const rangeEnd = Math.max(startIndex, endIndex);

        props.setRows((currentRows) => currentRows.map((row) => {
            if (row.id !== props.row.id) return row;

            return {
                ...row,
                steps: row.steps.map((value, stepIndex) => (
                    stepIndex >= rangeStart && stepIndex <= rangeEnd ? nextValue : value
                )),
            };
        }));
    };

    const stopPainting = useCallback(() => {
        isPaintingRef.current = false;
        lastPaintedIndexRef.current = null;
    }, []);

    useEffect(() => {
        window.addEventListener('pointerup', stopPainting);
        window.addEventListener('pointercancel', stopPainting);
        window.addEventListener('blur', stopPainting);

        return () => {
            window.removeEventListener('pointerup', stopPainting);
            window.removeEventListener('pointercancel', stopPainting);
            window.removeEventListener('blur', stopPainting);
        };
    }, [stopPainting]);

    const startPainting = (event, index) => {
        if (event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();

        const nextValue = !props.row.steps[index];
        isPaintingRef.current = true;
        paintValueRef.current = nextValue;
        lastPaintedIndexRef.current = index;
        paintRange(index, index, nextValue);
    };

    const continuePainting = (index) => {
        if (!isPaintingRef.current || lastPaintedIndexRef.current === index) return;

        paintRange(lastPaintedIndexRef.current, index, paintValueRef.current);
        lastPaintedIndexRef.current = index;
    };

    if (!props.row || !Array.isArray(props.row.steps)) {
        return <div>Loading...</div>
    }

    return (
        <>
            <SampleArea
                index={props.index}
                rowId={props.row.id}
                audio={props.row.audioFile}
                playSound={props.playSound}
                delete={props.delete}
                isReplaceTarget={props.isReplaceTarget}
            />
            <div className='step-sequencer' style={{'gridTemplateColumns': `repeat(${props.steps}, 1fr)`}}>
                    {props.row.steps.length > 0 ?
                            props.row.steps.map((val, idx) => {
                                return <button
                                    type="button"
                                    onPointerDown={(event) => startPainting(event, idx)}
                                    onPointerEnter={() => continuePainting(idx)}
                                    onPointerUp={stopPainting}
                                    className={ `block ${((idx % 8) - (idx % 4) == 0 ? 'even' : 'odd')} ${(val ? 'active' : 'not-active')}` }
                                    key={idx}
                                > | </button>
                            }) : null
                    }
            </div>
        </>
    )
}

export default SampleRow
