import React, { useEffect, useState } from 'react'
import '../styles/sidebar.css'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'
import { useDraggable } from "@dnd-kit/core";
import { useRef } from "react";
import { nanoid } from "nanoid";


export function SidebarField(props) {
    const { audioFile, pic, overlay } = props;
  
    let className = "sidebar-field";
    if (overlay) {
        className += " overlay";
    }
  
    return  <div className={className}>
                {audioFile}
                {pic && <img src={pic} alt={`Waveform of ${audioFile}`} />}
            </div>;
  }

function DraggableSidebarField(props) {
    const { audioFile, pic, ...rest } = props;
  
    const id = useRef(nanoid());
  
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: id.current,
        data: {
            audioFile,
            fromSidebar: true
        }
    });
  
    return (
      <div
        ref={setNodeRef}
        className="sidebar-item"
        {...listeners}
        {...attributes}
      >
        <SidebarField audioFile={audioFile} pic={pic} {...rest} />
      </div>
    );
  }


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
                    await ffmpeg.exec(['-i', `sound${index}.wav`, '-filter_complex', "compand,showwavespic=s=640x120:colors=#FFFFFF", '-frames:v', '1', `output${index}.png`])
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

    const handleDragStart = (event, sample) => {
        event.dataTransfer.setData("sampleData", JSON.stringify(sample)); // Store sample data
    };
    
    return(
        <>
            <div key={props.fieldsRegKey} className="sidebar">
                <div className="sidebar-items">
                    {Object.keys(props.audioList).map((audioFile, index) => {
                        return <DraggableSidebarField key={index} audioFile={audioFile} pic={waveforms[audioFile]} onDragStart={(e) => handleDragStart(e, audioFile)} />
                    })}
                </div>
            </div>
        </>
    )
}

export default Sidebar;