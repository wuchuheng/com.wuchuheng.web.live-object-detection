import React from 'react';
import { InfoSection } from './InfoSection/InfoSection';
import {Footer} from "./Footer/Footer"
import { VideoSection } from './VideoSection/VideoSection';

const App: React.FC = () => {
  return (
    <div className="container">
      <header>
        <h1>Real-Time Object Detection</h1>
      </header>
      <main>
        <VideoSection />
        <InfoSection />
      </main>
      <Footer />
    </div>
  );
};

export default App;