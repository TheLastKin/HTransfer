import React from 'react';
import '../componentCss/viewer.css'
import { MediaInfo } from 'renderer/constant/types';

type MediaViewerProps = {
  onBackdropClicked: (e: React.MouseEvent) => void,
  src: string
}

const MediaViewer = ({ onBackdropClicked, src }: MediaViewerProps) => {

  return (
    <div className="media_viewer" onClick={onBackdropClicked}>
      {
        src.match(/\.(mp4|webm|ogg|mov)$/i) ?
          <video className='viewer_media' src={src} controls={false} muted loop autoPlay />
          :
          <img className='viewer_media' src={src} alt="" />
      }
    </div>
  );
};

export default MediaViewer;
