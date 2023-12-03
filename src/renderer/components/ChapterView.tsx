import React, { useContext, useEffect, useRef, useState } from 'react';
import { Chapter, ImageInfo, actions, activeColor } from 'renderer/constant/types';
import { BsFillTriangleFill } from 'react-icons/bs';
import '../componentCss/chapter_view.css';
import ChapterContextMenu from './ChapterContextMenu';
import { IoMdRemoveCircleOutline } from 'react-icons/io'
import { MdOutlineSwapVerticalCircle } from 'react-icons/md'
import { AppContext, ModalContext } from 'renderer/constant/context';

type ChapterViewProps = {
  chapter: Chapter;
  addType: string,
  currentSource: string,
  onChapterSelected: (index: number) => void;
  onChapterAction: (isAddingImage: boolean) => void;
  onViewingChapter: (chapter: Chapter) => void;
};

let editingChapter: Chapter = { name: "", images: [], createDate: 0, modifiedDate: 0 };
let fromIndex = -1;

function ChapterView({
  chapter,
  addType,
  currentSource,
  onChapterSelected,
  onChapterAction,
  onViewingChapter,
}: ChapterViewProps) {
  const { chapters, saveChapter } = useContext(AppContext)
  const { setModal } = useContext(ModalContext)
  const [inputType, setInputType] = useState("Create");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if(chapter){
      if(editingChapter.name === chapter.name && editingChapter.images?.length !== chapter.images?.length){
        const imageTab = document.querySelector(".chapter_image_tab") as HTMLElement;
        imageTab.scrollTop = imageTab.scrollHeight
      }else{
        editingChapter = chapter;
      }
    }
  }, [chapter])

  const onDeletingChapterImage = (imageIndex: number) => {
    let newChapter: Chapter = { ...chapter, images: chapter?.images?.slice(0, imageIndex).concat(chapter.images.slice(imageIndex+1)), modifiedDate: Date.now() }
    saveChapter(newChapter)
    if(currentSource === newChapter.name){
      onViewingChapter(newChapter)
    }
  }

  const onChangingImageIndex = (fromIndex: number, toIndex: number) => {
    let oldImages = chapter.images || [];
    let newImages = oldImages.slice(0, fromIndex).concat(oldImages.slice(fromIndex+1))
    newImages.splice(Math.max(toIndex-1, 0), 0, oldImages[fromIndex]);
    let newChapter: Chapter = { ...chapter, images: newImages, modifiedDate: Date.now() }
    saveChapter(newChapter)
    if(currentSource === newChapter.name){
      onViewingChapter(newChapter)
    }
  }

  const onDeletingChapter = (chapter: Chapter) => {
    saveChapter(chapter, true)
  }

  const selectChapter = (chapterName: string, index: number) => () => {
    onChapterSelected(index);
    const container = document.querySelector(
      '.tab_view_content'
    ) as HTMLElement;
    const heading = document.querySelector(
      '.chapter_heading>span'
    ) as HTMLElement;
    const goBackButton = document.querySelector('.go_back') as HTMLElement;
    container.style.left = '-100%';
    heading.innerText = chapterName;
    goBackButton.style.display = 'block';
    onChapterAction(true);
  };

  const validateChapterName = (name: string) => {
    if(name.length < 3 || /[^a-zA-Z0-9\s]/g.test(name)){
      setModal({ visible: true, message: "Chapter name must contain at least 3 characters and no special characters"})
      return false
    }
    return true
  }

  const onChangingChapterName = (newName: string) => {
    if(validateChapterName(newName)){
      let newChapter: Chapter = { ...chapter, name: newName }
      saveChapter(newChapter)
    }
  }

  const goBack = () => {
    const container = document.querySelector(
      '.tab_view_content'
    ) as HTMLElement;
    const heading = document.querySelector(
      '.chapter_heading>span'
    ) as HTMLElement;
    const goBackButton = document.querySelector('.go_back') as HTMLElement;
    container.style.left = '0';
    heading.innerText = 'Chapters';
    goBackButton.style.display = 'none';
    onChapterAction(false);
    onChapterSelected(-1)
  };

  const toggleInputType = () => {
    const input = document.querySelector("#chapter_input") as HTMLInputElement;
    input.value = ""
    if(inputType === "Create"){
      input.placeholder = "Type here to search chapter!"
    }else{
      input.placeholder = "Type here to create a chapter!"
    }
    setSearchText("")
    setInputType(inputType === "Create" ? "Search" : "Create")
  }

  const handleInput = (e: React.KeyboardEvent) => {
    const value = (e.target as HTMLInputElement).value;
    if(inputType === "Change index"){
      if(e.code === "Enter"){
        if(fromIndex !== -1 && typeof(parseInt(value)) === "number"){
          onChangingImageIndex(fromIndex, parseInt(value));
          fromIndex = -1
          toggleInputType()
        }
      }
    }else if(inputType === "Change name"){
      if(e.code === "Enter"){
        onChangingChapterName(value)
        toggleInputType()
      }
    }else{
      if(e.code === "Tab"){
        toggleInputType()
      }else{
        if(inputType === "Search"){
          setSearchText(value)
        }else{
          if(e.code === "Enter"){
            if(chapters.some(c => c.name === value)){
              setModal({ visible: true, message: "Chapter exised!" })
            }else{
              if(validateChapterName(value)){
                saveChapter({ name: value, images: [], createDate: Date.now(), modifiedDate: Date.now() });
                (e.target as HTMLInputElement).value = ""
              }
            }
          }
        }
      }
    }
  }

  const onChapterContext = (chapter: Chapter) => (e: React.MouseEvent) => {
    editingChapter = chapter;
    const context = document.querySelector(".chapter_menu") as HTMLElement;
    context.style.left = `${e.clientX}px`
    context.style.top = `${e.clientY}px`
    context.style.display = "block"
  }

  const handleShowingImages = () => onViewingChapter(editingChapter)

  const handleRenamingChapter = () => {
    setInputType("Change name")
    const input = document.querySelector("#chapter_input") as HTMLInputElement;
    input.placeholder = `Rename to`
    input.type = "text"
    input.value = editingChapter.name
    input.focus()
  }

  const handleDeletingChapter = () => {
    onDeletingChapter(editingChapter)
  }

  const handleDeletingChapterImage = (imageIndex: number) => () => onDeletingChapterImage(imageIndex)

  const handleChaningImageIndex = (index: number) => () => {
    setInputType("Change index")
    fromIndex = index
    const input = document.querySelector("#chapter_input") as HTMLInputElement;
    input.placeholder = `Change image index from #${index+1} to`
    input.type = "number"
    input.value = ""
    input.focus()
  }

  const getBackgroundColor = () => {
    if(inputType === "Create") return "rgb(85, 118, 190)"
    if(inputType === "Search") return "grey"
    if(inputType === "Change name") return "indigo"
    return "rgb(223, 219, 15)"
  }

  const showPreviewImage = (source: string) => (e: React.MouseEvent) => {
    const imagePreview = document.querySelector(".image_preview") as HTMLElement;
    const imgView = imagePreview.firstChild as HTMLImageElement;
    const containerBounds = (e.target as HTMLElement).getBoundingClientRect();
    imgView.src = source
    imgView.onload = () => {
      imagePreview.style.left = `${containerBounds.left - 190}px`
      imagePreview.style.top = `${Math.min(containerBounds.top - (imgView.clientHeight/2 + 90), window.innerHeight - (imgView.clientHeight + 110))}px`
      imagePreview.style.opacity = "1"
      imagePreview.style.zIndex = "4"
    }
  }

  const onScroll = () => {
    const imagePreview = document.querySelector(".image_preview") as HTMLElement;
    if(imagePreview.style.opacity === "1"){
      imagePreview.style.opacity = "0"
      imagePreview.style.zIndex = "-1"
    }
  }

  return (
    <div className="chapter_view">
      <div className="add_chapter">
        <input
          type="text"
          id="chapter_input"
          placeholder="Type here to create a chapter!"
          onKeyUp={handleInput}
        />
        <div style={{ backgroundColor: getBackgroundColor() }} className="chapter_button" onClick={toggleInputType}>
          <span>{inputType}</span>
        </div>
      </div>
      <div className="chapter_heading">
        <BsFillTriangleFill className="go_back" onClick={goBack} />
        <span
          style={{
            color: addType === actions.ADD_CHAPTER_IMAGE ? activeColor : 'white',
          }}
        >
          Chapters
        </span>
      </div>
      <div className="tab_view">
        <div className="tab_view_content">
          <div className="chapter_tab">
            {chapters.filter(c => c.name.toLowerCase().includes(searchText.toLowerCase())).map((chapter, index) => (
              <div className="chapter" onClick={selectChapter(chapter.name, index)} onContextMenu={onChapterContext(chapter)}>
                <div className="chapter_left">
                  <span>{chapter.name}</span>
                  <span>
                    {chapter.images?.length || 0} images | created:{' '}
                    {new Date(chapter.createDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="chapter_right" />
              </div>
            ))}
          </div>
          <div className="chapter_image_tab" onScroll={onScroll}>
            {chapter &&
              (chapter.images!.length > 0 ? (
                chapter.images!.map((image: ImageInfo, index) => (
                  <div className="chapter_image">
                    <div className='chapter_image_name' onClick={showPreviewImage(image.path)}>{(index+1) + "." + image.name}</div>
                    <MdOutlineSwapVerticalCircle className='change_chapter_image_index' onClick={handleChaningImageIndex(index)}/>
                    <IoMdRemoveCircleOutline className='delete_chapter_image' onClick={handleDeletingChapterImage(index)}/>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    color:
                      addType === actions.ADD_CHAPTER_IMAGE ? activeColor : 'white',
                  }}
                  className="chapter_no_image"
                >
                  <span>
                    Right click on images to add to chapter <br />
                    (hold Ctrl and hover to quick add)
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
      <ChapterContextMenu onShowingImages={handleShowingImages} onRenamingChapter={handleRenamingChapter} onDeletingChapter={handleDeletingChapter}/>
    </div>
  );
}

export default ChapterView;
