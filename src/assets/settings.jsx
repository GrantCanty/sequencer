import React from "react";

const Settings = (props) => {
    
    return(
        <div className="settings">
            <button onClick={props.togglePlay} > play </button>
            <input 
                value={props.bpm}
                onChange={props.newBpm}
            ></input>
        </div>
    )
}

export default Settings;