import { useEffect, useRef, useState } from 'react'
import '../styles/sidebar.css'
import { useDraggable } from "@dnd-kit/core";
import { nanoid } from "nanoid";

async function createWaveformUrl(audioBuffer) {
    const width = 640;
    const height = 120;
    const verticalPadding = 8;
    const samples = audioBuffer.getChannelData(0);
    const silenceThreshold = 10 ** (-50 / 20);
    let firstSample = 0;
    let lastSample = samples.length - 1;

    while (firstSample < lastSample && Math.abs(samples[firstSample]) < silenceThreshold) {
        firstSample += 1;
    }

    while (lastSample > firstSample && Math.abs(samples[lastSample]) < silenceThreshold) {
        lastSample -= 1;
    }

    const visibleSampleCount = lastSample - firstSample + 1;
    const waveformPoints = [];

    for (let x = 0; x < width; x += 1) {
        const bucketStart = firstSample + Math.floor((x / width) * visibleSampleCount);
        const bucketEnd = Math.min(
            lastSample + 1,
            firstSample + Math.floor(((x + 1) / width) * visibleSampleCount),
        );
        let representativeSample = samples[bucketStart] || 0;

        for (let index = bucketStart + 1; index < Math.max(bucketStart + 1, bucketEnd); index += 1) {
            if (Math.abs(samples[index]) > Math.abs(representativeSample)) {
                representativeSample = samples[index];
            }
        }

        waveformPoints.push(representativeSample);
    }

    const peak = Math.max(...waveformPoints.map((sample) => Math.abs(sample)), 0.0001);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const centerY = height / 2;
    const amplitude = centerY - verticalPadding;

    context.beginPath();
    waveformPoints.forEach((sample, index) => {
        const x = (index / (waveformPoints.length - 1)) * (width - 1);
        const y = centerY - (sample / peak) * amplitude;

        if (index === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    });
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.stroke();

    const waveformBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return waveformBlob ? URL.createObjectURL(waveformBlob) : null;
}

const handleClick = (file) => {
        const audio = new Audio(file);
        audio.play();
    }

export function SidebarField(props) {
    const { audioFileName, audioFile, pic, overlay } = props;
    const displayName = audioFileName ?? audioFile;
  
    let className = "sidebar-field";
    if (overlay) {
        className += " overlay";
    }
  
    return  <div className={className} onClick={overlay ? undefined : () => handleClick(audioFile)}>
                {displayName}
                {pic && <img src={pic} alt={`Waveform of ${displayName}`} />}
            </div>;
  }

function DraggableSidebarField(props) {
    const { audioFileName, audioFile, pic, ...rest } = props;
  
    const id = useRef(nanoid());
  
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: id.current,
        data: {
            // The sequencer stores its rows by sample name, not by asset URL.
            audioFile: audioFileName,
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
        <SidebarField audioFileName={audioFileName} audioFile={audioFile} pic={pic} {...rest} />
      </div>
    );
  }


const Sidebar = (props) => {
    const [waveforms, setWaveforms] = useState({});

    useEffect(() => {
        let cancelled = false;

        const generateWaveforms = async () => {
            const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            const decoder = new OfflineAudioContext(1, 1, 44100);
            const newWaveforms = {};

            await Promise.all(Object.keys(props.audioList).map(async (audioFile) => {
                try {
                    const response = await fetch(props.audioList[audioFile]);
                    const sourceBuffer = await response.arrayBuffer();
                    const decodedAudio = await decoder.decodeAudioData(sourceBuffer);
                    newWaveforms[audioFile] = await createWaveformUrl(decodedAudio);
                } catch (error) {
                    console.error('error processing', error)
                }
            }));

            if (cancelled) {
                Object.values(newWaveforms).forEach((url) => {
                    if (url) URL.revokeObjectURL(url);
                });
                return;
            }

            setWaveforms(newWaveforms);

        }
        generateWaveforms();

        return () => {
            cancelled = true;
        };
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
                    {Object.keys(props.audioList).map((audioFileName, index) => {
                        return <DraggableSidebarField key={index} audioFile={props.audioList[audioFileName]} audioFileName={audioFileName} pic={waveforms[audioFileName]} onDragStart={(e) => handleDragStart(e, audioFileName)} />
                    })}
                </div>
            </div>
        </>
    )
}

export default Sidebar;
