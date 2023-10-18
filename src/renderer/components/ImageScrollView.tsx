import React, { useContext, useEffect, useRef, useState } from 'react';
import '../componentCss/image_scroll_view.css'
import { AppContext } from 'renderer/constant/context';
import { HighlightImage, ImageInfo } from 'renderer/constant/types';
import ImageCard from './ImageCard';
import TransferModal from './TransferModal';

type ImageScrollViewProps = {
  highlightImages: HighlightImage[],
  images: ImageInfo[],
  onImageClicked: (e: React.MouseEvent, index: number) => void,
  onImageContextMenu: (image: ImageInfo) => void,
  onImageMouseEnter: (e: React.MouseEvent, image: ImageInfo) => void,
  onImageMouseLeave: (e: React.MouseEvent, image: ImageInfo) => void,
  onInfoIconClicked: (image: ImageInfo) => void
}

const indexes = [5, 4, 3, 2, 1]
const maxImageLoad = 30;
let isLoadingNextPage = false
let isFirstRender = true;

const ImageScrollView = ({ highlightImages, images, onImageClicked, onImageContextMenu, onImageMouseEnter, onImageMouseLeave, onInfoIconClicked }: ImageScrollViewProps) => {
  const [page, setPage] = useState(1);
  const [filteredImages, setFilteredImages] = useState<ImageInfo[]>([])
  const { savedInfos, imageFilter, appSettings, SDProps } = useContext(AppContext)
  const pageRef = useRef(1)

  pageRef.current = page

  useEffect(() => {
    setPage(1)
    filterImage()
  }, [images])

  useEffect(() => {
    if(!isFirstRender){
      filterImage()
    }else{
      isFirstRender = false
    }
  }, [imageFilter])

  useEffect(() => {
    const scrollView = document.querySelector(".image_scroll_view") as HTMLElement;
    if(scrollView){
      scrollView.scrollTop = 0
    }
  }, [appSettings.showInRow])

  const filterImage = () => {
    if(images.length === 0){
      setFilteredImages([])
      return;
    }
    let newImages = images.map(i => (savedInfos.find(i2 => i.path === i2.path) || i))
    if(imageFilter.selectedTags.length > 0){
      let direction = imageFilter.extraSettings.viewByTagOrder;
      if(direction.length > 0){
        newImages = newImages.filter(t => {
          if(t.tags){
            for(let tag of t.tags){
              if(imageFilter.selectedTags.some(t => t.name === tag.name && t.type === tag.type)){
                return true
              }
            }
          }
          return false
        })
        newImages.sort((i1, i2) => {
          let total1 = i1.tags?.reduce((total, tag) => {
            let index = imageFilter.selectedTags.findIndex(t => t.name === tag.name && t.type === tag.type);
            if(index !== -1){
              return direction === "leftToRight" ? total + (index+1) : total - (index+1)
            }
            return total
          }, 0)
          let total2 = i2.tags?.reduce((total, tag) => {
            let index = imageFilter.selectedTags.findIndex(t => t.name === tag.name && t.type === tag.type);
            if(index !== -1){
              return direction === "leftToRight" ? total + (index+1) : total - (index+1)
            }
            return total
          }, 0)
          return (total1 || 0) - (total2 || 0)
        })
        setFilteredImages(newImages)
        return;
      }
      if(imageFilter.sortBy.type === "Most relevant"){
        newImages.sort((i1, i2) => {
          let total1 = i1.tags?.reduce((total, tag) => total + (imageFilter.selectedTags.some(t => t.name === tag.name && t.type === tag.type) ? 2 : 1), 0) || 0
          let total2 = i2.tags?.reduce((total, tag) => total + (imageFilter.selectedTags.some(t => t.name === tag.name && t.type === tag.type) ? 2 : 1), 0) || 0
          return imageFilter.sortBy.asc ? total1 - total2 : total2 - total1
        })
        setFilteredImages(newImages)
      }
      if(imageFilter.extraSettings.withoutSelectedTags){
        newImages = newImages.filter(image => {
          if(image.tags){
            for(let tag of image.tags){
              if(imageFilter.selectedTags.some(t => t.name === tag.name && t.type === tag.type)){
                return false
              }
            }
          }
          return true
        })
      }else{
        newImages = newImages.filter(image => {
          if(image.tags){
            for(let tag of imageFilter.selectedTags){
              if(!image.tags.some(t => t.name === tag.name && t.type === tag.type)){
                return false
              }
            }
            return true
          }else{
            return false
          }
        })
      }
    }
    if(imageFilter.sortBy.type === "Date created"){
      newImages.sort((i1, i2) => imageFilter.sortBy.asc ? (i1.createdDate || 0) - (i2.createdDate || 0) : (i2.createdDate || 0) - (i1.createdDate || 0))
      setFilteredImages(newImages)
      return;
    }
    if(imageFilter.sortBy.type === "Date modified"){
      newImages.sort((i1, i2) => imageFilter.sortBy.asc ? (i1.lastModifiedDate || 0) - (i2.lastModifiedDate || 0) : (i2.lastModifiedDate || 0) - (i1.lastModifiedDate || 0))
      setFilteredImages(newImages)
      return;
    }
    setFilteredImages(newImages)
  }

  const onScroll = (e: React.UIEvent) => {
    const scrollView = (e.target) as HTMLElement;
    if (pageRef.current * maxImageLoad < images.length) {
      scrollView.onscroll = () => {
        if (
          scrollView.clientHeight + scrollView.scrollTop >=
            scrollView.scrollHeight && !isLoadingNextPage) {
          isLoadingNextPage = true
          setPage(pageRef.current + 1);
          setTimeout(() => {
            isLoadingNextPage = false
          }, 500)
        }
      };
    }
  }

  const getHighlighType = (path: string) => {
    return highlightImages.find(i => i.path === path)?.highlightType || -1;
  }

  return (
    <div className='image_scroll_view' onScroll={onScroll}>
      {
        appSettings.showInRow ?
        <div className="row">
          {
            filteredImages.filter((image, index) => index <= maxImageLoad * page).map((image) =>
              <ImageCard
                image={image}
                SDprompt={SDProps.find(prop => prop.ofImage === image.path)?.prompt}
                highlight={getHighlighType(image.path)}
                index={filteredImages.findIndex(i => i.path === image.path)}
                onImageClicked={onImageClicked}
                onImageContextMenu={onImageContextMenu}
                onImageMouseEnter={onImageMouseEnter}
                onImageMouseLeave={onImageMouseLeave}
                onInfoIconClicked={onInfoIconClicked}
              />)
          }
        </div> :
        indexes.map(value => (
          <div className="column">
            {
              filteredImages.filter((image, index) => (index+value)%5 === 0 && index <= maxImageLoad * page).map((image) =>
                <ImageCard
                  image={image}
                  SDprompt={SDProps.find(prop => prop.ofImage === image.path)?.prompt}
                  highlight={getHighlighType(image.path)}
                  index={filteredImages.findIndex(i => i.path === image.path)}
                  onImageClicked={onImageClicked}
                  onImageContextMenu={onImageContextMenu}
                  onImageMouseEnter={onImageMouseEnter}
                  onImageMouseLeave={onImageMouseLeave}
                  onInfoIconClicked={onInfoIconClicked}
                />)
            }
          </div>
        ))
      }
      <TransferModal images={filteredImages}/>
    </div>
  );
};

export default ImageScrollView;
