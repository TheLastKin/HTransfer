import React, { useState } from 'react';
import { Chapter, ImageInfo } from 'renderer/constant/types';
import { BsFillTriangleFill } from 'react-icons/bs';
import '../componentCss/chapter_view.css';
import ChapterContextMenu from './ChapterContextMenu';

type ChapterViewProps = {
  chapter: Chapter;
  chapters: Chapter[];
  actionType: string;
  onChapterInput: (e: React.KeyboardEvent) => void;
  onChapterSelected: (chapter: Chapter) => void;
  onChapterAction: (isAddingImage: boolean) => void;
  onViewingChapter: (chapter: Chapter) => void;
  onDeletingChapterImage: (imageIndex: number) => void;
};

const activeColor = 'rgb(122, 245, 122)';

let editingChapter: Chapter = { name: "", images: [], createDate: 0, modifiedDate: 0 };

function ChapterView({
  chapter,
  chapters,
  actionType,
  onChapterInput,
  onChapterSelected,
  onChapterAction,
  onViewingChapter,
  onDeletingChapterImage
}: ChapterViewProps) {
  const [isSearching, setSearching] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");

  const selectChapter = (item: Chapter) => () => {
    onChapterSelected(item);
    const container = document.querySelector(
      '.tab_view_content'
    ) as HTMLElement;
    const heading = document.querySelector(
      '.chapter_heading>span'
    ) as HTMLElement;
    const goBackButton = document.querySelector('.go_back') as HTMLElement;
    container.style.left = '-100%';
    heading.innerText = item.name;
    goBackButton.style.display = 'block';
    onChapterAction(true);
  };

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
  };

  const onMouseEnter = (path: string) => (e: React.MouseEvent) => {
    const imgCard = document.querySelector(`.img_card[data-path="${path.replace(/\\/g, "\\\\")}"]`) as HTMLElement;
    if(imgCard){
      imgCard.style.borderColor = "blue"
      imgCard.style.boxShadow = "0 0 5px 1px rgba(0, 0, 255, 0.65)"
    }
  }

  const onMouseLeave = (path: string) => (e: React.MouseEvent) => {
    const imgCard = document.querySelector(`.img_card[data-path="${path.replace(/\\/g, "\\\\")}"]`) as HTMLElement;
    if(imgCard){
      imgCard.style.borderColor = ""
      imgCard.style.boxShadow = ""
    }
  }

  const toggleInputType = () => {
    (document.querySelector("#add_chapter_input") as HTMLInputElement).value = "";
    if(isSearching){
      setSearchText("")
    }
    setSearching(!isSearching)
  }

  const handleInput = (e: React.KeyboardEvent) => {
    if(isSearching){
      setSearchText((e.target as HTMLInputElement).value)
    }else{
      onChapterInput(e)
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

  const handleRenamingChapter = () => {}

  const handleDeletingChapter = () => {}

  const handleDeletingChapterImage = (imageIndex: number) => () => onDeletingChapterImage(imageIndex)

  const onChangingImageIndex = (fromIndex: number) => (e: React.KeyboardEvent) => {
    if(e.code === "Enter"){
      const toIndex = Math.max(parseInt((e.target as HTMLElement).innerText), 1);
    }
    if(!e.code.includes("Digit") && !e.code.includes("Backspace")){
      e.preventDefault()
    }
  }

  return (
    <div className="chapter_view">
      <div className="add_chapter">
        <input
          type="text"
          id="add_chapter_input"
          placeholder="Type here to create a chapter!"
          onKeyDown={handleInput}
        />
        <div style={{ backgroundColor: isSearching ? "grey" : "rgb(85, 118, 190)", borderColor: isSearching ? "grey" : "rgb(85, 118, 190)" }} className="add_chapter_button" onClick={toggleInputType}>
          {isSearching ? "Search" : "Create"}
        </div>
      </div>
      <div className="chapter_heading">
        <BsFillTriangleFill className="go_back" onClick={goBack} />
        <span
          style={{
            color: actionType === 'addChapterImage' ? activeColor : 'white',
          }}
        >
          Chapters
        </span>
      </div>
      <div className="tab_view">
        <div className="tab_view_content">
          <div className="chapter_tab">
            {chapters.filter(c => c.name.toLowerCase().includes(searchText.toLowerCase())).map((chapter) => (
              <div className="chapter" onClick={selectChapter(chapter)} onContextMenu={onChapterContext(chapter)}>
                <div className="chapter_left">
                  <span>{chapter.name}</span>
                  <span>
                    {chapter.images?.length} images | created:{' '}
                    {new Date(chapter.createDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="chapter_right" />
              </div>
            ))}
          </div>
          <div className="chapter_image_tab">
            {chapter &&
              (chapter.images!.length > 0 ? (
                chapter.images!.map((image: ImageInfo, index) => (
                  <div className="chapter_image" onMouseEnter={onMouseEnter(image.path || "")} onMouseLeave={onMouseLeave(image.path || "")}>
                    <div className="chapter_image_index" contentEditable onKeyDown={onChangingImageIndex(index)}>{index+1}</div>
                    <div>.</div>
                    <div className='chapter_image_name'>{image.name}</div>
                    <div className="delete_chapter_image" onClick={handleDeletingChapterImage(index)}>x</div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    color:
                      actionType === 'addChapterImage' ? activeColor : 'white',
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
