import { useState } from 'react'
import Hud from './Component/Hud.jsx'
import Table from './Component/Table.jsx';  
import ControlPanel from './Component/ControlPanel.jsx';
import './App.css'


function App() {
  return (
    <>
     <div className="stage">
      <Hud /> 
      <Table />
     
      <ControlPanel/>
       </div>
    </>
  );
}

export default App
