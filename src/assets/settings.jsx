import React, { useState, useEffect } from "react";

const Settings = (props) => {
    
    const [playText, setPlayText] = useState('');

    useEffect(() => {
        console.log(props.play)
        props.play ? setPlayText('stop') : setPlayText('play')
    }, [props.play])

    return(
        <div className="settings">
            <button onClick={props.togglePlay} > { playText } </button>
            <input 
                value={props.bpm}
                onChange={props.newBpm}
            ></input>
        </div>
    )
}

export default Settings;