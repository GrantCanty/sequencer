import React, { useEffect, useState } from 'react'
import '../styles/sidebar.css'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'
import { useDraggable } from "@dnd-kit/core";
import { useRef } from "react";
import { nanoid } from "nanoid";

async function createTightWaveformUrl(file) {
    const sourceUrl = URL.createObjectURL(new Blob([file], { type: 'image/png' }));
    const image = await new Promise((resolve, reject) => {
        const nextImage = new Image();
        nextImage.onload = () => resolve(nextImage);
        nextImage.onerror = reject;
        nextImage.src = sourceUrl;
    });

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = image.width;
    sourceCanvas.height = image.height;
    const sourceContext = sourceCanvas.getContext('2d');
    sourceContext.drawImage(image, 0, 0);

    const { data, width, height } = sourceContext.getImageData(0, 0, image.width, image.height);
    let firstVisibleColumn = width;
    let lastVisibleColumn = -1;
    let firstVisibleRow = height;
    let lastVisibleRow = -1;

    for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
            const offset = (y * width + x) * 4;
            const brightness = data[offset] + data[offset + 1] + data[offset + 2];
            if (data[offset + 3] > 10 && brightness > 60) {
                firstVisibleColumn = Math.min(firstVisibleColumn, x);
                lastVisibleColumn = Math.max(lastVisibleColumn, x);
                firstVisibleRow = Math.min(firstVisibleRow, y);
                lastVisibleRow = Math.max(lastVisibleRow, y);
            }
        }
    }

    if (lastVisibleColumn < firstVisibleColumn || lastVisibleRow < firstVisibleRow) return sourceUrl;

    const tightCanvas = document.createElement('canvas');
    tightCanvas.width = width;
    tightCanvas.height = height;
    const verticalPadding = 8;
    tightCanvas.getContext('2d').drawImage(
        sourceCanvas,
        firstVisibleColumn,
        firstVisibleRow,
        lastVisibleColumn - firstVisibleColumn + 1,
        lastVisibleRow - firstVisibleRow + 1,
        0,
        verticalPadding,
        width,
        height - verticalPadding * 2,
    );

    const tightBlob = await new Promise((resolve) => tightCanvas.toBlob(resolve, 'image/png'));
    if (!tightBlob) return sourceUrl;

    URL.revokeObjectURL(sourceUrl);
    return URL.createObjectURL(tightBlob);
}


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
                    await ffmpeg.exec([
                        '-i', `sound${index}.wav`,
                        '-filter_complex',
                        'compand,silenceremove=stop_periods=-1:stop_duration=0.05:stop_threshold=-50dB,showwavespic=s=640x120:colors=#FFFFFF',
                        '-frames:v', '1',
                        `output${index}.png`,
                    ])
                    let pic = await ffmpeg.readFile(`output${index}.png`)
                    const imageUrl = await createTightWaveformUrl(pic);
                    
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
