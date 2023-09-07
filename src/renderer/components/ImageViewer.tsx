import React from 'react';
import '../componentCss/viewer.css'

const ImageViewer = () => {
  return (
    <div className="image_viewer">
      <img src="" alt="" className="viewer_image" draggable={false}/>
    </div>
  );
};

export default ImageViewer;
