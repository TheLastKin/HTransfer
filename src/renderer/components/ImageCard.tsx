import React, { useContext, useEffect, useState } from 'react';
import '../componentCss/image_card.css'
import { ImageInfo } from 'renderer/constant/types';
import { AppContext } from 'renderer/constant/context';
import { Buffer } from 'buffer';
const extract = require('png-chunks-extract')
const text = require('png-chunk-text')

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
  index: number,
  selected: boolean,
  onImageClicked: (e: React.MouseEvent, index: number) => void,
  onImageContextMenu: (image: ImageInfo) => void,
  onImageMouseEnter: (e: React.MouseEvent, image: ImageInfo) => void,
  onImageMouseLeave: (e: React.MouseEvent, image: ImageInfo) => void,
  onInfoIconClicked: (image: ImageInfo) => void
}

const ImageCard = ({ image, index, selected, onImageClicked, onImageContextMenu, onImageMouseEnter, onImageMouseLeave, onInfoIconClicked }: ImageCardProps) => {
  const [isSDImage, setSDImage] = useState(false)
  const { imageFilter } = useContext(AppContext)

  useEffect(() => {
    loadImage()
  }, [image])

  const loadImage = async () => {
    const container = document.querySelector(`.image_card[data-path="${image.path.replace(/\\/g, "\\\\")}"]`) as HTMLElement
    const imageView = container.querySelector(".image") as HTMLImageElement;
    let res = await fetch(`http://localhost:4000/${image.path.substring(3).replace(/\\/g, "/").replace(/ /g, "_")}`)
    if(res.status === 200){
      let buffer = Buffer.from(await res.arrayBuffer());
      let chunks = extract(buffer);
      const textChunks = chunks.filter((chunk: any) => chunk.name === "tEXt").map((chunk: any) => text.decode(chunk.data));
      if(imageView){
        if(textChunks[0]?.text){
          container.dataset.SDdata = textChunks[0].text
          setSDImage(true)
        }
      }
    }
  }

  const onImageLoaded = (e: React.SyntheticEvent) => {
    const img = (e.target as HTMLImageElement);
    const imgAvgColor = img.parentElement?.childNodes[1] as HTMLElement;
    const imgPreload = img.parentElement?.childNodes[2] as HTMLElement;
    const rgb = getAverageRGB(img)
    img.style.display = "block"
    imgAvgColor.style.backgroundColor = `rgb(${rgb.r}, ${rgb.b}, ${rgb.g})`
    imgPreload.style.display = "none"
  }

  const handleImageClick = (e: React.MouseEvent) => onImageClicked(e, index)

  const handleContextMenu = () => onImageContextMenu(image)

  const handleMouseEnter = (e: React.MouseEvent) => onImageMouseEnter(e, image)

  const handleMouseLeave = (e: React.MouseEvent) => onImageMouseLeave(e, image)

  const handleInfoIconClicked = (e: React.MouseEvent) => {
    const img = (e.target as HTMLElement).parentElement?.childNodes[0] as HTMLImageElement;
    onInfoIconClicked({ ...image, width: img.naturalWidth, height: img.naturalHeight })
  }

  return (
    <div className={`image_card ${selected ? "image_card_highlight" : ""}`} data-path={image.path}>
      <div className="image_card_content" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <img
          src={`http://localhost:4000/${image.path.substring(3).replace(/\\/g, "/").replace(/ /g, "_")}`}
          className="image"
          crossOrigin='anonymous'
          draggable={false}
          onLoad={onImageLoaded}
          onClick={handleImageClick}
          onContextMenu={handleContextMenu}
        />
        <div className="image_average_color"></div>
        <div className="image_preload"></div>
        <div className="info_icon" onClick={handleInfoIconClicked}>i</div>
        <div style={{ display: imageFilter.extraInfo.showIndex ? "flex" : "none" }} className="image_index">{index+1}</div>
        <div style={{ display: imageFilter.extraInfo.showName ? "flex" : "none" }} className="image_name">
          <span>{image.name}</span>
        </div>
        {isSDImage && <div style={{ display: imageFilter.extraInfo.hasSDPrompt ? "flex" : "none" }} className="sd_image">SD</div>}
      </div>
    </div>
  );
};

export default ImageCard;
