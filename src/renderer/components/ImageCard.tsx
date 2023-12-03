import React, { useContext, useEffect, useRef } from 'react';
import '../componentCss/image_card.css'
import { ImageInfo, maxImageLoad } from 'renderer/constant/types';
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


type ImageCardProps = {
  image: ImageInfo,
  SDprompt: string | undefined,
  index: number,
  highlight: number,
  intersect: IntersectionObserver | undefined,
  onImageClicked: (e: React.MouseEvent, index: number) => void,
  onImageContextMenu: (image: ImageInfo) => void,
  onImageMouseEnter: (e: React.MouseEvent, image: ImageInfo) => void,
  onImageMouseLeave: (e: React.MouseEvent, image: ImageInfo) => void,
  onInfoIconClicked: (image: ImageInfo) => void
}

const ImageCard = ({ image, SDprompt, index, highlight, intersect, onImageClicked, onImageContextMenu, onImageMouseEnter, onImageMouseLeave, onInfoIconClicked }: ImageCardProps) => {
  const { imageFilter } = useContext(AppContext)
  const viewRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<ImageInfo>(image)
  imageRef.current = image

  useEffect(() => {
    if(intersect && viewRef.current){
      intersect.observe(viewRef.current)
    }
    return () => {
      if(intersect && viewRef.current) {
        intersect.unobserve(viewRef.current);
      }
    }
  }, [image, intersect])

  const onImageLoaded = (e: React.SyntheticEvent) => {
    const img = (e.target as HTMLImageElement);
    const imgPreload = img.parentElement?.querySelector(".image_preload") as HTMLElement;
    img.style.display = "block"
    if(imgPreload){
      imgPreload.remove()
    }
    const card = img.parentElement?.parentElement as HTMLElement;
    card.style.aspectRatio = `${img.naturalWidth/img.naturalHeight}`
  }

  const handleImageClick = (e: React.MouseEvent) => onImageClicked(e, index)

  const handleContextMenu = () => onImageContextMenu(image)

  const handleMouseEnter = (e: React.MouseEvent) => onImageMouseEnter(e, image)

  const handleMouseLeave = (e: React.MouseEvent) => onImageMouseLeave(e, image)

  const handleInfoIconClicked = (e: React.MouseEvent) => {
    const img = (e.target as HTMLElement).parentElement?.childNodes[0] as HTMLImageElement;
    onInfoIconClicked({ ...image, width: img.naturalWidth, height: img.naturalHeight })
  }

  const getClassName = () => {
    if(highlight === 1){
      return "image_card image_card_highlight"
    }
    if(highlight === 2){
      return "image_card image_card_highlight_2"
    }
    return "image_card"
  }

  const onLoadError = (e: React.SyntheticEvent) => {
    // saveImageInfos(savedInfos.filter(i => i.path === image.path));
  }

  return (
    <div ref={viewRef} className={getClassName()} data-path={image.path}>
      <div className="image_card_content" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <img
          src={image.path}
          className="image"
          crossOrigin='anonymous'
          draggable={false}
          onLoad={onImageLoaded}
          onError={onLoadError}
          onClick={handleImageClick}
          onContextMenu={handleContextMenu}
        />
        <div className="image_preload"></div>
        <div className="info_icon" onClick={handleInfoIconClicked}>i</div>
        <div style={{ display: imageFilter.extraInfo.showIndex ? "flex" : "none" }} className="image_index">{index+1}</div>
        <div style={{ display: imageFilter.extraInfo.showName ? "flex" : "none" }} className="image_name">
          <span>{image.name}</span>
        </div>
        {SDprompt && <div style={{ display: imageFilter.extraInfo.hasSDPrompt ? "flex" : "none" }} className="sd_image">SD</div>}
      </div>
    </div>
  );
};

export default ImageCard;
