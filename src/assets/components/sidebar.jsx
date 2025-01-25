import React from 'react'
import '../../styles/sidebar.css'

const audioFiles = import.meta.glob('../audio/*.wav', { eager: true });
const audioList = Object.fromEntries(
    Object.entries(audioFiles).map(([key, value]) => [key.replace('../audio/', '').replace('.wav', ''), value.default])
);



const Sidebar = () => {
    const handleClick = (file) => {
        const audio = new Audio(file);
        audio.play();
    }
    
    return(
        <>
            <div className="sidebar">
                <h1>yoo</h1>
                <ul>
                {Object.keys(audioList).map((audioFile, index) => {
                    return <li key={index} onClick={() => handleClick(audioList[audioFile])}>{audioFile}</li>
                })}
                </ul>
            </div>
        </>
    )
}

export default Sidebar;