import React, { useState, useEffect } from "react";

const Settings = (props) => {
    const [playText, setPlayText] = useState('');
    const [draftBpm, setDraftBpm] = useState(props.bpm);

    useEffect(() => {
        props.play ? setPlayText('stop') : setPlayText('play')
    }, [props.play])

    useEffect(() => {
        setDraftBpm(props.bpm);
    }, [props.bpm]);

    const confirmBpm = (event) => {
        if (event.key !== 'Enter') return;

        const nextBpm = Number(draftBpm);
        if (Number.isFinite(nextBpm) && nextBpm > 0) {
            props.newBpm(String(nextBpm));
            event.currentTarget.blur();
        } else {
            setDraftBpm(props.bpm);
        }
    };

    return(
        <div className="settings">
            <button onClick={props.togglePlay} > { playText } </button>
            <input 
                aria-label="Tempo in beats per minute"
                inputMode="decimal"
                value={draftBpm}
                onChange={(event) => setDraftBpm(event.target.value)}
                onKeyDown={confirmBpm}
                onBlur={() => setDraftBpm(props.bpm)}
            ></input>
        </div>
    )
}

export default Settings;
