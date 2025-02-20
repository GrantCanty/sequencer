import React from 'react'
import '../styles/sidebar.css'

const Sidebar = (props) => {
    const handleClick = (file) => {
        const audio = new Audio(file);
        audio.play();
    }
    
    return(
        <>
            <div className="sidebar">
                <h1>yoo</h1>
                <ul>
                {Object.keys(props.audioList).map((audioFile, index) => {
                    return <li key={index} onClick={() => handleClick(props.audioList[audioFile])}>{audioFile}</li>
                })}
                </ul>
            </div>
        </>
    )
}

export default Sidebar;