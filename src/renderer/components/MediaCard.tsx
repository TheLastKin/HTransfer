import React, { useContext, useEffect, useRef } from 'react';
import '../componentCss/media_card.css'
import { MediaInfo, maxMediaLoad } from 'renderer/constant/types';
import { AppContext } from 'renderer/constant/context';

const getAverageRGB = (imgEl: HTMLImageElement) => {
  const blockSize = 5; // only visit every 5 pixels
  const defaultRGB = { r: 0, g: 0, b: 0 }; // for non-supporting envs
  const canvas = document.createElement('canvas');
  const context = canvas.getContext && canvas.getContext('2d');
  let data;
  let width;
  let height;
  let i = -4;
  let length;
  const rgb = { r: 0, g: 0, b: 0 };
  let count = 0;

  if (!context) {
    return defaultRGB;
  }

  height = canvas.height =
    imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
  width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

  context.drawImage(imgEl, 0, 0);

  data = context.getImageData(0, 0, width, height);

  length = data.data.length;

  while ((i += blockSize * 4) < length) {
    ++count;
    rgb.r += data.data[i];
    rgb.g += data.data[i + 1];
    rgb.b += data.data[i + 2];
  }

  // ~~ used to floor values
  rgb.r = ~~(rgb.r / count);
  rgb.g = ~~(rgb.g / count);
  rgb.b = ~~(rgb.b / count);

  return rgb;
};


type MediaCardProps = {
  media: MediaInfo,
  SDprompt: string | undefined,
  index: number,
  highlight: number,
  intersect: IntersectionObserver | undefined,
  onMediaClicked: (e: React.MouseEvent, index: number, isVideo: boolean) => void,
  onMediaContextMenu: (media: MediaInfo) => void,
  onMediaMouseEnter: (e: React.MouseEvent, media: MediaInfo) => void,
  onMediaMouseLeave: (e: React.MouseEvent, media: MediaInfo) => void,
  onInfoIconClicked: (media: MediaInfo & any) => void
}

const MediaCard = ({ media, SDprompt, index, highlight, intersect, onMediaClicked, onMediaContextMenu, onMediaMouseEnter, onMediaMouseLeave, onInfoIconClicked }: MediaCardProps) => {
  const { mediaFilter } = useContext(AppContext)
  const viewRef = useRef<HTMLDivElement | null>(null)
  const mediaRef = useRef<MediaInfo>(media)
  mediaRef.current = media

  useEffect(() => {
    if(intersect && viewRef.current){
      intersect.observe(viewRef.current)
    }
    return () => {
      if(intersect && viewRef.current) {
        intersect.unobserve(viewRef.current);
      }
    }
  }, [media, intersect])
  const onMediaLoaded = (e: React.SyntheticEvent) => {
    const tag = (e.target as HTMLElement);
    tag.style.display = "block"
    const { width, height } = tag.getBoundingClientRect();
    const card = tag.parentElement?.parentElement as HTMLElement;
    card.style.aspectRatio = `${width} / ${height}`;
  }

  const handleMediaClick = (isVideo: boolean) => (e: React.MouseEvent) => onMediaClicked(e, index, isVideo)

  const handleContextMenu = () => onMediaContextMenu(media)

  const handleMouseEnter = (e: React.MouseEvent) => onMediaMouseEnter(e, media)

  const handleMouseLeave = (e: React.MouseEvent) => onMediaMouseLeave(e, media)

  const handleInfoIconClicked = (e: React.MouseEvent) => {
    const media = (e.target as HTMLElement).parentElement?.childNodes[0] as HTMLImageElement;
    onInfoIconClicked({ ...media, width: media.naturalWidth, height: media.naturalHeight })
  }

  const getClassName = () => {
    if(highlight === 1){
      return "media_card media_card_highlight"
    }
    if(highlight === 2){
      return "media_card media_card_highlight_2"
    }
    return "media_card"
  }

  const onLoadError = (e: React.SyntheticEvent) => {
    // saveMediaInfos(savedInfos.filter(i => i.path === media.path));
  }

  return (
    <div ref={viewRef} className={getClassName()} data-path={media.path}>
      <div className="media_card_content" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {
          /\.(mp4|webm|ogg|mov)$/i.test(media.path) ?
            <video
              className="media"
              src={"file:///" + media.path}
              data-src={media.path}
              muted
              loop
              autoPlay
              onClick={handleMediaClick(true)}
              onContextMenu={handleContextMenu}
              onLoadedData={onMediaLoaded}
              onError={onLoadError}
            />
            :
            <img
              className="media"
              src={"file:///" + media.path}
              data-src={media.path}
              onClick={handleMediaClick(false)}
              onContextMenu={handleContextMenu}
              onLoad={onMediaLoaded}
              onError={onLoadError}
            />
        }
        <div className="media_preload"></div>
        <div className="info_icon" onClick={handleInfoIconClicked}>i</div>
        <div style={{ display: mediaFilter.extraInfo.showIndex ? "flex" : "none" }} className="media_index">{index+1}</div>
        <div style={{ display: mediaFilter.extraInfo.showName ? "flex" : "none" }} className="media_name">
          <span>{media.name}</span>
        </div>
        {SDprompt && <div style={{ display: mediaFilter.extraInfo.hasSDPrompt ? "flex" : "none" }} className="sd_media">SD</div>}
      </div>
    </div>
  );
};

export default MediaCard;
