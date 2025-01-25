import { useState } from 'react'
import './App.css'
import './assets/components/sidebar'
import Sidebar from './assets/components/sidebar'

function App() {
  const [step, setStep] = useState([false, false, false, false, false, false, false, false])
  const [play, stePlay] = useState(false)
  
  const toggleIndex = (index) => {
    console.log("index: ", index)
    setStep((prevArray) =>
      prevArray.map((value, i) => (i === index ? !value : value))
    );
  };

  const togglePlay = () => {
    setPlay((prevState) => !prevState)
  }

  const range = []
  for (let i = 0; i < 8; i++) {
    range[i] = i
  }

  return (
    <div className='wrapper'>
      {console.log(step)}
      <Sidebar />
      <div className='sequencer-wrapper'>
        <h1>sequencer!!</h1>
        <div className='sequencer'>
          <div className='sample'>
            <p>sample</p>
          </div>
          <div className='step-sequencer'>
            
              {step.map((val, idx) => {
                return   <button key={idx} onClick={() => toggleIndex(idx)}> {idx} {val | 0} </button>
              })}
            
               
            
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
