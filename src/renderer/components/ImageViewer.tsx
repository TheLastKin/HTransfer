import React from 'react';
import '../componentCss/viewer.css'
import { ImageInfo } from 'renderer/constant/types';

type ImageViewerProps = {
  onBackropClicked: (e: React.MouseEvent) => void
}

const ImageViewer = ({ onBackropClicked }: ImageViewerProps) => {

  return (
    <div className="image_viewer" onClick={onBackropClicked}>
      <img src="" alt="" className="viewer_image" draggable={false}/>
    </div>
  );
};

export default ImageViewer;
