import React, { useEffect, useState } from 'react'
import '../styles/sidebar.css'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'

const Sidebar = (props) => {
    const [waveforms, setWaveforms] = useState({});

    
    const handleClick = (file) => {
        const audio = new Audio(file);
        audio.play();
    }

    const ffmpeg = new FFmpeg({ log: true });

    useEffect(() => {
        const generateWaveforms = async () => {
            try {
                if (!ffmpeg.loaded) {
                    await ffmpeg.load({ coreURL, wasmURL })
                }
            }
            catch (error) {
                console.error("error loading ffmpeg: ", error)
            }

            const newWaveforms = {}

            await Promise.all(Object.keys(props.audioList).map(async (audioFile, index) => {
                try {
                    await ffmpeg.writeFile(`sound${index}.wav`, await fetchFile(props.audioList[audioFile]))
                    await ffmpeg.exec(['-i', `sound${index}.wav`, '-filter_complex', "showwavespic=s=640x120:colors=#5000FF", '-frames:v', '1', `output${index}.png`])
                    let pic = await ffmpeg.readFile(`output${index}.png`)
                    
                    const blob = new Blob([pic], { type: 'image/png' });
                    const imageUrl = URL.createObjectURL(blob);
                    
                    newWaveforms[audioFile] = imageUrl;


                } catch (error) {
                    console.error('error processing', error)
                }
            }))
            setWaveforms(newWaveforms)

        }
        generateWaveforms();
    }, [props.audioList])

    useEffect(() => {
        return () => {
            // Revoke all blob URLs to prevent memory leaks
            Object.values(waveforms).forEach(url => {
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [waveforms]);
    
    return(
        <>
            <div className="sidebar">
                <h1>yoo</h1>
                <ul>
                {Object.keys(props.audioList).map((audioFile, index) => {
                    return <li key={index} onClick={() => handleClick(props.audioList[audioFile])}>
                        {audioFile}
                        {waveforms[audioFile] && <img src={waveforms[audioFile]} alt={`Waveform of ${audioFile}`} />}
                    </li>
                })}
                </ul>
            </div>
        </>
    )
}

export default Sidebar;